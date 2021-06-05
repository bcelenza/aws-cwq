import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandOutput
} from "@aws-sdk/client-cloudwatch-logs";

export const getLogGroupsByPrefix = async(logGroupPrefix: string, client: CloudWatchLogsClient): Promise<string[]> => {
    const logGroups: string[] = [];

    let response: DescribeLogGroupsCommandOutput = {
        $metadata: {}
    };
    do {
        response = await client.send(new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupPrefix,
            nextToken: response.nextToken
        }));

        const matchingLogGroups = response.logGroups;
        if (!matchingLogGroups) {
            throw new Error(`No log groups found for prefix ${logGroupPrefix}`);
        }

        logGroups.push(...matchingLogGroups.map(g => g.logGroupName!));
    } while (response.nextToken)

    return logGroups;
}

