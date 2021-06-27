const _ = require('lodash');
const fetch = require('node-fetch');
const fs = require('fs');

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

async function main() {
  const url = 'https://www.reddit.com/r/popular.json';
  const res = await fetch(url);
  const text = await res.text();
  const body = JSON.parse(text);

  const posts = body.data.children;
  const parsedPosts = posts.map(parsePost);

  console.log(JSON.stringify(parsedPosts, null, 2));
}

main();