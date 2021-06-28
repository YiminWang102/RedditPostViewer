const _ = require('lodash');
const fetch = require('node-fetch');
const fs = require('fs');

const DEFAULT_NUMPOSTS = 75;
const DEFAULT_SUBREDDIT = 'popular';

function calculateDowvotes(upvotes, ratio) {
  const downvotes = (upvotes * (1 - ratio)) / ratio;
  return Math.ceil(downvotes);
}

function parsePost(post) {
  const data = post.data;
  const id = _.get(data, 'name');
  const title = _.get(data, 'title');
  const upvotes = _.get(data, 'ups');
  const ratio = _.get(data, 'upvote_ratio');
  const downvotes = calculateDowvotes(upvotes, ratio);
  return {
    id,
    title,
    upvotes,
    downvotes,
  }
}

function savePosts(posts, options) {
  const {
    subreddit,
    numPosts,
  } = options;

  const fileName = `r_${subreddit}_${numPosts}.json`;
  const stringifiedPosts = JSON.stringify(posts, null, 2)
  fs.writeFileSync(fileName, stringifiedPosts);
}

function retrievePosts(options) {
  const {
    subreddit,
    numPosts,
  } = options;

  const fileName = `r_${subreddit}_${numPosts}.json`;

  let posts = [];
  if (fs.existsSync(fileName)) {
    const data = fs.readFileSync(fileName, 'utf8');
    posts = JSON.parse(data);
  }

  return posts;
}

function diffNewPosts(oldPosts, posts) {
  const newPosts = [];

  for (const post of posts) {
    if (!oldPosts.some(oldPost => oldPost.id === post.id)) {
      newPosts.push(post);
    }
  }
  return newPosts;
}

function logNewPosts(posts) {
  for (const post of posts) {
    const { title, upvotes, downvotes } = post;
    const logText = `
      New Post!
      Title: ${title}
      Upvotes: ${upvotes}, Downvotes: ${downvotes}
    `;

    console.log(logText);
  }
}

function diffOutdatedPosts(oldPosts, posts) {
  const outdatedPosts = [];

  for (const oldpost of oldPosts) {
    if (!posts.some(post => post.id === oldpost.id)) {
      outdatedPosts.push(oldpost);
    }
  }
  return outdatedPosts;
}

function logOutdatedPosts(posts) {
  if (posts.length) {
    console.log('These posts are no longer in the top:');
    for (const post of posts) {
      console.log(`${post.title}\n`);
    }
  }
}

function logVoteChanges(oldPosts, posts) {
  console.log('These posts have had their votes changed');
  for (const post of posts) {
    for (const oldPost of oldPosts) {
      if (post.id === oldPost.id) {
        const upvoteChange = post.upvotes - oldPost.upvotes;
        const downvoteChange = post.downvotes - oldPost.downvotes;

        const logText = `
          ${post.title}
          Upvotes: ${upvoteChange > 0 ? `+${upvoteChange}` : upvoteChange}
          Downvotes: ${downvoteChange > 0 ? `+${downvoteChange}` : downvoteChange}
        `;

        if (upvoteChange !== 0 && downvoteChange !== 0) {
          console.log(logText);
        }
      }
    }
  }
}

async function getPosts(options = {
  subreddit: 'popular',
  numPosts: 200,
}) {
  const { subreddit, numPosts } = options;

  const baseUrl = `https://www.reddit.com/r/${subreddit}.json`;
  let posts = [];
  let after = '';
  let count = 0;

  while (count < numPosts) {
    let url;

    if (count === 0) {
      url = baseUrl;
    } else {
      url = `${baseUrl}?count=${count}&after=${after}`;
    }

    const res = await fetch(url);
    const text = await res.text();
    const body = JSON.parse(text);
    const newPosts = body.data.children.map(parsePost);

    const lastPost = newPosts.slice(-1)[0];
    after = lastPost.id;
    count += 25;

    if (count > numPosts) {
      const postsToConcat = newPosts.slice(count - numPosts);
      posts = posts.concat(postsToConcat);
    } else {
      posts = posts.concat(newPosts);
    }
  }

  return posts;
}

function parseArgs(argv) {
  const options = {
    subreddit: DEFAULT_SUBREDDIT,
    numPosts: DEFAULT_NUMPOSTS,
  };

  const args = argv.slice(2);
  for (const arg of args) {
    [key, value] = arg.split('=');
    options[key] = value;    
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv);

  const posts = await getPosts(options);
  const oldPosts = retrievePosts(options);

  const newPosts = diffNewPosts(oldPosts, posts);
  logNewPosts(newPosts);

  const outdatedPosts = diffOutdatedPosts(oldPosts, posts);
  logOutdatedPosts(outdatedPosts);

  logVoteChanges(oldPosts, posts);

  await savePosts(posts, options);
}

main();