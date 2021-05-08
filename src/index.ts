#!/usr/bin/env ts-node-script
import {
  CloudWatchLogsClient,
  GetQueryResultsCommand,
  GetQueryResultsCommandOutput,
  QueryStatus,
  StartQueryCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { Parser as CsvParser } from "json2csv";
import * as yargs from "yargs";

import * as time from "./time";

const args = yargs
  .command("cwq", "Runs a CloudWatch insights query")
  .option("log-group", {
    alias: "l",
    type: "string",
    description: "The name of the log group",
  })
  .option("format", {
    alias: "f",
    type: "string",
    choices: ["csv", "json"],
    default: "csv",
    description: "The format of the results",
  })
  .option("start", {
    alias: "s",
    type: "string",
    default: "1h",
    description: "Where to start the search (duration or ISO 8601 format)",
  })
  .option("end", {
    alias: "e",
    type: "string",
    default: "now",
    description: "Where to end the search (duration or ISO 8601 format)",
  })
  .help()
  .alias("help", "h").argv;

(async function (): Promise<void> {
  // Parse arguments
  const logGroups = args.logGroup;
  if (!logGroups) {
    throw new Error("At least one log group is required");
  }
  const logGroupNames = Array.isArray(logGroups) ? logGroups : [logGroups];

  const startTime = Math.ceil(time.parseTimeOrDuration(args.start) / 1000);
  const endTime = Math.ceil(time.parseTimeOrDuration(args.end) / 1000);

  const query = args._[0];
  if (!query) {
    throw new Error("No query provided");
  }
  const queryString = query.toString();

  // Execute the query
  const logsClient = new CloudWatchLogsClient({});
  const startOutput = await logsClient.send(
    new StartQueryCommand({
      logGroupNames,
      queryString,
      startTime,
      endTime,
    })
  );
  const queryId = startOutput.queryId;

  // Poll for the results of the query every second until it completes
  let queryResults: GetQueryResultsCommandOutput = {
    $metadata: {},
    status: QueryStatus.Scheduled,
  };
  do {
    await new Promise((r) => setTimeout(r, 1000));
    queryResults = await logsClient.send(
      new GetQueryResultsCommand({
        queryId,
      })
    );
  } while (
    queryResults.status === QueryStatus.Scheduled ||
    queryResults.status === QueryStatus.Running
  );

  // If the command did not complete successfully, error with output
  if (queryResults.status !== QueryStatus.Complete) {
    throw new Error(
      `Query did not complete: output=${JSON.stringify(queryResults)}`
    );
  }

  if (!queryResults.results) {
    throw new Error("No results returned");
  }

  // Translate results into an array of key/value pairs, excluding the pointer field
  const results = queryResults.results.map((r) => {
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

  // Output the results in the desired format
  switch (args.format) {
    case "csv":
      console.log(new CsvParser().parse(results));
      break;
    case "json":
      console.log(JSON.stringify(results));
      break;
  }
})().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
