# When is my ride

[When is my ride](https://whenismyride.jackratner.com) is a Clojure/ClojureScript app I built back in early 2022 to view upcoming subway trains at a given subway stop. Start typing the name of your stop in the search bar and then tap on your stop among the listed suggestions.

The selected stop persists to the URL, so bookmark your typical stops, or save them to your home screen for even faster access.

Yes, this kind of web app is a dime a dozen, but I like to think the implementation was a novel exercise.

The state of the subway network stored as a graph in memory using [datascript](https://github.com/tonsky/datascript) - a Clojure datalog implementation. The GTFS subway feeds are massive protobuf files containing the current state of all active trains on a given group of lines, so data fetching from the MTA is handled on a background thread.

All upcoming train timing requests will pull from the current cached state of the GTFS-RT data from the MTA, as long as that data is recent enough to not be considered stale. If the real-time train data is stale, the background process will begin rebuilding the real-time elements of the database with the latest GTFS-RT data from the MTA. The web request will block until the latest data is resolved into the db. The real-time data will then be proactively refreshed periodically for the next few minutes to improve response times during this period of anticipated use.

Visit the [live site here](https://whenismyride.jackratner.com) and view the source on [GitHub](https://github.com/jackrr/when-is-my-ride).
