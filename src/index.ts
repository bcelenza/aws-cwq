import {
  CloudWatchLogsClient,
  GetQueryResultsCommand,
  GetQueryResultsCommandOutput,
  QueryStatus,
  StartQueryCommand,
  StopQueryCommand
} from "@aws-sdk/client-cloudwatch-logs";
import { Parser as CsvParser } from "json2csv";
import json2md from "json2md";
import * as yargs from "yargs";

import * as logs from "./logs";
import * as time from "./time";
import * as util from "./util";

let runningQueryId: string | undefined;
const logsClient = new CloudWatchLogsClient({});
process.on("SIGINT", async () => {
  if (runningQueryId) {
    console.error(`Cancelling running query with ID ${runningQueryId}`);
    await logsClient.send(
      new StopQueryCommand({
        queryId: runningQueryId,
      })
    );
    process.exit(0);
  }
});

(async function (): Promise<void> {
  // Parse arguments
  const args = await yargs
    .strictOptions()
    .option("log-group", {
      alias: "l",
      type: "string",
      description: "The name of the log group",
    })
    .option("format", {
      alias: "f",
      type: "string",
      choices: ["csv", "json", "md", "markdown"],
      default: "csv",
      description: "The format of the results",
    })
    .option("start", {
      alias: "s",
      type: "string",
      default: "1h",
      description: "When to start the search (duration or ISO 8601 format)",
    })
    .option("end", {
      alias: "e",
      type: "string",
      default: "now",
      description: "When to end the search (duration or ISO 8601 format)",
    })
    .option("message-only", {
      alias: "m",
      type: "boolean",
      default: false,
      description: "Return just the message in plain-text format (no CSV)",
    })
    .demandOption("log-group", "At least one log group is required.")
    .help()
    .alias("help", "h").argv;
  const logGroups = args.logGroup;
  if (!logGroups) {
    throw new Error("A log group is required (specify with -l or --log-group)");
  }

  const inputLogGroupNames: string[] = Array.isArray(logGroups)
    ? logGroups
    : [logGroups];

  const startTime = time.parseTimeOrDuration(args.start);
  const endTime = time.parseTimeOrDuration(args.end);

  const query = args._[0];
  if (!query) {
    throw new Error("No query provided");
  }
  const queryString = query.toString();

  // Expand log group names
  const logGroupNames = await logs.expandLogGroups(
    inputLogGroupNames,
    logsClient
  );
  if (logGroupNames.size === 0) {
    throw new Error("No explicit or matching log groups provided.");
  }

  console.error(`Querying between ${new Date(
    startTime
  ).toISOString()} and ${new Date(endTime).toISOString()}
    for ${logGroupNames.size} log group(s): ${JSON.stringify([
    ...logGroupNames,
  ])}\n`);

  // Execute the query
  const startOutput = await logsClient.send(
    new StartQueryCommand({
      logGroupNames: [...logGroupNames],
      queryString,
      // CloudWatch uses standard unix timestamp (seconds since epoch)
      startTime: Math.ceil(startTime / 1000),
      endTime: Math.ceil(endTime / 1000),
    })
  );
  runningQueryId = startOutput.queryId;

  // Poll for the results of the query every second until it completes
  let queryResults: GetQueryResultsCommandOutput = {
    $metadata: {},
    status: QueryStatus.Scheduled,
  };
  do {
    await new Promise((r) => setTimeout(r, 1000));
    queryResults = await logsClient.send(
      new GetQueryResultsCommand({
        queryId: runningQueryId,
      })
    );
    const stats = queryResults.statistics!;
    const megabytesScanned = ((stats.bytesScanned || 0) / 1024 / 1024).toFixed(
      2
    );
    process.stderr.write(
      `\r    ${stats.recordsScanned} records (${megabytesScanned} MB) scanned, ${stats.recordsMatched} matched`
    );
  } while (
    queryResults.status === QueryStatus.Scheduled ||
    queryResults.status === QueryStatus.Running
  );
  runningQueryId = undefined;
  process.stderr.write("\n\n");

  // If the command did not complete successfully, error with output
  if (queryResults.status !== QueryStatus.Complete) {
    throw new Error(
      `Query failed with status ${queryResults.status}: ${JSON.stringify(
        queryResults
      )}`
    );
  }

  const results = queryResults.results!;
  // Translate results into an array of key/value pairs, excluding the pointer field
  const mappedResults = results.map((r) => {
    const result: { [key: string]: string } = {};
    for (const item of r) {
      const field = item.field || "<no name>";
      if (item.field === "@ptr") {
        continue;
      }

      result[field] = item.value || "";
    }
    return result;
  });

  if (mappedResults.length === 0) {
    console.error("No results returned.");
    return;
  }

  // Output the results in the desired format
  if (args["message-only"]) {
    mappedResults.forEach((r) =>
      console.log(util.unescapeValue(r["@message"]))
    );
  } else {
    switch (args.format) {
      case "csv":
        console.log(new CsvParser().parse(mappedResults));
        break;
      case "json":
        console.log(JSON.stringify(mappedResults));
        break;
      case "md":
      case "markdown":
        console.log(
          json2md([
            {
              table: {
                headers: Object.keys(mappedResults[0]),
                rows: mappedResults.map((r) => Object.values(r)),
              },
            },
          ])
        );
        break;
    }
  }
})().catch((e: Error) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
