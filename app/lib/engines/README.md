## Engines
Engines are business logic subsystems that may do the following:
  - log data for testing/tracking purposes
  - leverage external systems or infrastructure to perform calculations
  - return calculated results based on inputs

They may NOT:
  - induce side effects in external systems
  - retrieve data from sources other than those provided or pointed to by the calling service (i.e. fetching data from an S3 bucket is ok as long as that s3 bucket name/key is provided as an argument)
