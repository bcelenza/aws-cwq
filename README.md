# CloudWatch Logs Query (`cwq`)

The missing command-line interface for [Amazon CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html).

CWQ is designed for fast searching and presentation of log data in multiple formats for reading or processing. It is intended as a tool to quickly share queries and results with others, or cement and maintain queries in operational runbooks/playbooks. For advanced processing command output can be piped (`|`) to another process, for example using `--format json` with [jq](https://stedolan.github.io/jq/).

The basic command structure is:

```bash
cwq --log-group <log-group> '<query>'
```

Where `<log-group>` is the log group you want to search and `<query>` is the [CloudWatch Logs Insights query](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html) to search with.

Further usage guidelines are described below and options can be found via the help argument:

```bash
cwq -h
```

## Installation

```bash
$ npm install -g cwq
```

## Usage

`cwq` commands require at least a log group and a query:

```bash
$ cwq --log-group MyLogGroup 'filter @type = "REPORT" | stats max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)'

Querying between 2021-10-30T18:12:46.491Z and 2021-10-30T19:12:46.491Z
    for 1 log group(s): ["MyLogGroup"]

"bin(5m)","maxMemoryUsedMB"
"2021-10-30 19:10:00.000","229"
"2021-10-30 19:05:00.000","229"
"2021-10-30 19:00:00.000","229"
"2021-10-30 18:55:00.000","229"
"2021-10-30 18:50:00.000","229"
"2021-10-30 18:45:00.000","229"
"2021-10-30 18:40:00.000","229"
"2021-10-30 18:35:00.000","229"
"2021-10-30 18:30:00.000","229"
"2021-10-30 18:25:00.000","229"
"2021-10-30 18:20:00.000","229"
"2021-10-30 18:15:00.000","229"
```

The default output of the command is a CSV representation of the query results for the last hour, which you can save to a file or pipe to other commands for further processing. `cwq` also supports other [output formats](#formats) and [time ranges](#time-ranges).

The CLI respects any AWS environment variables provided, so you can use it across accounts and regions:

```bash
$ AWS_PROFILE=staging AWS_REGION=us-east-1 cwq --log-group MyLogGroup 'filter @message like /ERROR/'
```

## Examples

### Time Ranges

By default, `cwq` will query over the previous hour:

```bash
$ cwq --log-group MyLogGroup 'filter @message like /ERROR/' # results for last hour returned
```

To set a custom start time, pass `--start` (or `-s`) with a duration or ISO 8601 formatted time.

Example for find errors from the last 8 hours:

```bash
$ cwq --log-group MyLogGroup --start 8h 'filter @message like /ERROR/'
```

Find errors within a specific time range (ISO 8601 format):

```bash
$ cwq --log-group MyLogGroup --start 2021-05-08T06:00:00Z --end 2021-05-08T12:00:00Z 'filter @message like /ERROR/'
```

### Formats

#### Comma Separated Values (CSV)

The default output format is CSV, which can be piped in a unix command line to other utilities like `read`, `sed`, and `tr`, or to a file and opened as a spreadsheet.

```bash
$ cwq --log-group MyLogGroup 'filter @type = "REPORT" | stats max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)'

Querying between 2021-10-30T18:12:46.491Z and 2021-10-30T19:12:46.491Z
    for 1 log group(s): ["MyLogGroup"]

"bin(5m)","maxMemoryUsedMB"
"2021-10-30 19:10:00.000","229"
"2021-10-30 19:05:00.000","229"
"2021-10-30 19:00:00.000","229"
"2021-10-30 18:55:00.000","229"
"2021-10-30 18:50:00.000","229"
"2021-10-30 18:45:00.000","229"
"2021-10-30 18:40:00.000","229"
"2021-10-30 18:35:00.000","229"
"2021-10-30 18:30:00.000","229"
"2021-10-30 18:25:00.000","229"
"2021-10-30 18:20:00.000","229"
"2021-10-30 18:15:00.000","229"
```

#### JSON

You can use JSON for more advanced result manipulation:

```bash
$ cwq --log-group MyLogGroup --format json 'filter @type = "REPORT" | stats max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)'

Querying between 2021-10-30T18:12:46.491Z and 2021-10-30T19:12:46.491Z
    for 1 log group(s): ["MyLogGroup"]

[{"bin(5m)":"2021-10-30 19:10:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 19:05:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 19:00:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:55:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:50:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:45:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:40:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:35:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:30:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:25:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:20:00.000","maxMemoryUsedMB":"229"},{"bin(5m)":"2021-10-30 18:15:00.000","maxMemoryUsedMB":"229"}]
```

#### Markdown

If you need to share on a medium that supports [Markdown](https://en.wikipedia.org/wiki/Markdown):

```bash
$ cwq --format markdown --log-group MyLogGroup 'filter @type = "REPORT" | stats max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)'

Querying between 2021-10-30T18:12:46.491Z and 2021-10-30T19:12:46.491Z
    for 1 log group(s): ["MyLogGroup"]

| bin(5m) | maxMemoryUsedMB |
| ------- | --------------- |
| 2021-10-30 19:10:00.000 | 229 |
| 2021-10-30 19:05:00.000 | 229 |
| 2021-10-30 19:00:00.000 | 229 |
| 2021-10-30 18:55:00.000 | 229 |
| 2021-10-30 18:50:00.000 | 229 |
| 2021-10-30 18:45:00.000 | 229 |
| 2021-10-30 18:40:00.000 | 229 |
| 2021-10-30 18:35:00.000 | 229 |
| 2021-10-30 18:30:00.000 | 229 |
| 2021-10-30 18:25:00.000 | 229 |
| 2021-10-30 18:20:00.000 | 229 |
| 2021-10-30 18:15:00.000 | 229 |
```

#### Just The Messages

Sometimes you only want the log message from the returned data, as if you were reading the log file on the host. You can get that by passing `-m` or `--message-only`:

```bash
$ cwq --message-only --logGroup MyLogGroup 'filter @message like /ERROR/'

2021-10-30T04:23:25.477Z	5bc694d8-b2e6-4147-9bba-6488c6854bb0	ERROR	Something broke
2021-10-30T04:19:25.098Z	5bc694d8-b2e6-4147-9bba-6488c6854bb0	ERROR	Something else broke
```

### Log Group Matching

If you want to search across multiple log groups, you can pass each log group separately with multiple `--log-group` arguments:

```bash
$ cwq --log-group MyLogGroup --log-group MyOtherLogGroup 'filter @message like /ERROR/'
```

You can also provide a glob expression to the `--log-group` argument to match log group names by prefix:

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

The necessary permissions are also available in the `CloudWatchReadOnlyAccess` [managed policy](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html#aws-managed-policies).