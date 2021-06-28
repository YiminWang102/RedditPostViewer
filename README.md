# Reddit Post Info Aggregator

Command line tool that provides information about the top posts from the Reddit

On each run of your program, it prints out:

1. New posts from the last program execution,

2. Posts that are no longer within the top posts, and

3. Posts that had a vote count change and by how much.

## How to start

`npm start` to run the program

By default it will use the top 75 posts from r/popular

## Options

You can specify the number of posts and the subreddit with the `subreddit` and `numPosts` options like so

`npm start -- subreddit=<subreddit> numPosts=<numPosts>`

e.g. `npm start -- subreddit=askreddit numPosts=25`

### Bugs and Limitations

* Reddit only returns up to 25 results at a time. To get the next 25, you need to specify that they come after the 25th post that came from the previous request. Tho unlikely, this could potentially result in a race condition where the ranking of a post changes in bewteen requests and it slips through.
* I didn't optimize for performance, so some functionality like diffing new/outdated posts can be slow for big numbers of posts. 
* For ease of implementation, each number of top posts per subreddit is separate. Meaning if you run the program for top 50 posts of r/popular, it will not use the top 75 posts of r/popular to figure out new/old posts or vote tally changes.
* Reddit does not return the actual number of downvotes a post has. They give a "upvote_ratio" instead which can be used to deduce the number of downvotes, but it is no exact. 
