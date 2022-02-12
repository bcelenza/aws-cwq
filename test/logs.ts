import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogGroupsCommandOutput, LogGroup } from '@aws-sdk/client-cloudwatch-logs';
import chai from 'chai';
const expect = chai.expect;
chai.use(require('chai-as-promised'));
import { mock, instance, verify, anyOfClass, when } from 'ts-mockito';
import * as logs from '../src/logs';

describe('logs', () => {
    describe('expandLogGroups', () => {
        it('returns a list of static log group names from input', async() => {
            const client: CloudWatchLogsClient = mock(CloudWatchLogsClient);
            const inputNames = ['foo', 'bar', 'baz'];
            const expandedLogGroups = await logs.expandLogGroups(inputNames, instance(client));
            expect(Array.from(expandedLogGroups)).to.eql(inputNames);
            verify(client.send(anyOfClass(DescribeLogGroupsCommand))).never();
        });

        it('de-dupes names from input', async() => {
            const client: CloudWatchLogsClient = mock(CloudWatchLogsClient);
            const inputNames = ['foo', 'bar', 'baz', 'baz'];
            const expandedLogGroups = await logs.expandLogGroups(inputNames, instance(client));
            expect(Array.from(expandedLogGroups)).to.eql(['foo', 'bar', 'baz']);
            verify(client.send(anyOfClass(DescribeLogGroupsCommand))).never();
        });

        it('expands log group names from prefix input', async() => {
            const client: CloudWatchLogsClient = mock(CloudWatchLogsClient);
            const inputNames = ['foo', 'bar*'];
            const mockOutput: DescribeLogGroupsCommandOutput = {
                '$metadata': {},
                logGroups: [{ logGroupName: 'barbaz'} as LogGroup, { logGroupName: 'barbob' } as LogGroup],
            };
            when(client.send(anyOfClass(DescribeLogGroupsCommand))).thenResolve(mockOutput);
            const expandedLogGroups = await logs.expandLogGroups(inputNames, instance(client));
            expect(Array.from(expandedLogGroups)).to.eql(['foo', 'barbaz', 'barbob']);
            verify(client.send(anyOfClass(DescribeLogGroupsCommand))).once();
        });

        it('throws when no matching log groups are found', async() => {
            const client: CloudWatchLogsClient = mock(CloudWatchLogsClient);
            const inputNames = ['bar*'];
            const mockOutput: DescribeLogGroupsCommandOutput = {
                '$metadata': {},
                logGroups: undefined,
            };
            when(client.send(anyOfClass(DescribeLogGroupsCommand))).thenResolve(mockOutput);
            expect(logs.expandLogGroups(inputNames, instance(client))).to.be.rejectedWith(/No log groups found for prefix.*/);
            verify(client.send(anyOfClass(DescribeLogGroupsCommand))).once();
        });

        it('throws when the input is not a prefix match', async() => {
            const client: CloudWatchLogsClient = mock(CloudWatchLogsClient);
            let inputNames = ['bar*-*'];
            expect(logs.expandLogGroups(inputNames, instance(client))).to.be.rejectedWith(/Could not match log group by name.*/);

            inputNames = ['*bar'];
            expect(logs.expandLogGroups(inputNames, instance(client))).to.be.rejectedWith(/Could not match log group by name.*/);

            verify(client.send(anyOfClass(DescribeLogGroupsCommand))).never();
        });
    });
});