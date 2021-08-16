# CloudWatch Logs Query (`cwq`)

Executes a [CloudWatch Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html) query against one or more log groups. Command output options are available for further parsing of results.

## Installation

```bash
$ npm install -g cwq
$ cwq --help
```

## Usage

`cwq` commands require at least a log group and a query:

```bash
$ cwq --log-group MyLogGroup 'filter @message like /ERROR/'
```

The output of the command is a CSV representation of the query results, which you can save to a file or pipe to other commands for further processing. `cwq` also supports other formats (see `--help`).

By default, the search period will be between 1 hour ago and now. You can change this by setting either `--start`, `--end`, or both (see examples below).

The CLI respects any AWS environment variables provided, so you can use it across accounts and regions:

```bash
$ AWS_PROFILE=staging AWS_REGION=us-east-1 cwq --log-group MyLogGroup 'filter @message like /ERROR/'
```

## Examples

### Time Ranges

Find errors in a specific log group over the last hour:

```bash
$ cwq --log-group MyLogGroup 'filter @message like /ERROR/'
```

Find errors across multiple log groups over the last hour:

```bash
$ cwq --log-group MyLogGroup --log-group AnotherLogGroup 'filter @message like /ERROR/'
```

Find errors from the last 8 hours:

```bash
$ cwq --log-group MyLogGroup --start 8h 'filter @message like /ERROR/'
```

Find errors within a specific time range (ISO 8601 format):

```bash
$ cwq --log-group MyLogGroup --start 2021-05-08T06:00:00Z --end 2021-05-08T12:00:00Z 'filter @message like /ERROR/'
```

### Formats

Change output format to JSON for more advanced queries (Lambda memory example):

```bash
$ cwq --log-group MyLogGroup --format json 'filter @type = "REPORT" | status max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)'
```

Pipe the CSV output into a markdown formatter for sharing with friends (using [`csvtomd`](https://github.com/mplewis/csvtomd)):

```bash
$ cwq --log-group MyLogGroup 'filter @type = "REPORT" | status max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)' | csvtomd
```

Log only the message from the returned data (using `-m` or `--message-only`):

```bash
$ cwq --message-only --logGroup MyLogGroup 'filter @message like /ERROR'
```

### Log Group Matching

You can provide a glob expression to the `--log-group` argument to match log group names by prefix:

```bash
$ cwq --log-group 'MyPrefix-*' 'filter @message like /ERROR/'
```

## IAM Policy Requirements

In order to run this utility, the IAM entity associated with the call must `ALLOW` the following actions:

```
logs:StartQuery
logs:GetQueryResults
logs:StopQuery
logs:DescribeLogGroups
```
