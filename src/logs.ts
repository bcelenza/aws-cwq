import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandOutput
} from "@aws-sdk/client-cloudwatch-logs";

const getLogGroupsByPrefix = async (
  logGroupPrefix: string,
  client: CloudWatchLogsClient
): Promise<string[]> => {
  const logGroups: string[] = [];

  let response: DescribeLogGroupsCommandOutput = {
    $metadata: {},
  };
  do {
    response = await client.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupPrefix,
        nextToken: response.nextToken,
      })
    );

    const matchingLogGroups = response.logGroups;
    if (!matchingLogGroups) {
      throw new Error(`No log groups found for prefix ${logGroupPrefix}`);
    }

    logGroups.push(...matchingLogGroups.map((g) => g.logGroupName!));
  } while (response.nextToken);

  return logGroups;
};

export const expandLogGroups = async (
  inputLogGroupNames: string[],
  client: CloudWatchLogsClient
): Promise<Set<string>> => {
  const logGroupNames = new Set<string>();
  for (const inputName of inputLogGroupNames) {
    if (inputName.includes("*")) {
      // ensure only one asterisk is provided at the end
      if (
        !inputName.endsWith("*") ||
        (inputName.match(/\*/g) || []).length > 1
      ) {
        throw new Error(
          `Could not match log group by name ${inputName}: only prefix matching is supported by CloudWatch.`
        );
      }

      const matchingLogGroups = await getLogGroupsByPrefix(
        inputName.replace(/\*/g, ""),
        client
      );
      matchingLogGroups.forEach((g) => logGroupNames.add(g));
    } else {
      logGroupNames.add(inputName);
    }
  }
  return logGroupNames;
};
