# CloudWatch Query (`cwq`)

Runs a [CloudWatch Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html) query against a specified set of log groups (one or more). Command output options are available for further parsing of results (e.g. csv, json).

Start and end times can be provided, but the default will search the last hour.

#### Examples

Find errors in a specific log group over the last hour:

```
$ cwq --log-group MyLogGroup 'filter @message like /ERROR/'
```

Find errors across multiple log groups over the last hour:

```
$ cwq --log-group MyLogGroup --log-group AnotherLogGroup 'filter @message like /ERROR/'
```

Find errors from the last 8 hours:

```
$ cwq --log-group MyLogGroup --start 8h 'filter @message like /ERROR/'
```

Find errors within a specific time range (ISO 8601 format):

```
$ cwq --log-group MyLogGroup --start 2021-05-08T06:00:00Z --end 2021-05-08T12:00:00Z 'filter @message like /ERROR/'
```

Change output format to JSON for more advanced queries (Lambda memory example):

```
$ cwq --log-group MyLogGroup --format json 'filter @type = "REPORT" | status max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)'
```

Pipe the CSV output into a markdown formatter for sharing with friends (using [`csvtomd`](https://github.com/mplewis/csvtomd)):

```
$ cwq --log-group MyLogGroup 'filter @type = "REPORT" | status max(@maxMemoryUsed / 1000 / 1000) as maxMemoryUsedMB by bin(5m)' | csvtomd
```
