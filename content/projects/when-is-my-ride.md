# When is my ride

When is my ride was a Clojure/ClojureScript app to view upcoming subway trains at a given subway stop. Yes, the product is a dime a dozen, but the implementation was a fun exercise.

The state of the subway network stored as a graph in memory using [datascript](https://github.com/tonsky/datascript) - a Clojure datalog implementation. The GTFS subway feeds are massive protobuf files containing the current state of all active trains on a given group of lines, so data fetching from the MTA is cached and periodically refreshed after web requests.

View the source on [Github](https://github.com/jackrr/when-is-my-ride).

I abandoned the project a few years ago. I'd like to put in some time to get this back online soon!
