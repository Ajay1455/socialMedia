const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

class User {
  constructor(id, username, email, password) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.posts = [];
    this.following = [];
  }

  addPost(content) {
    const post = new Post(content);
    this.posts.push(post);
    return post;
  }

  follow(user) {
    this.following.push(user);
  }

  unfollow(user) {
    this.following = this.following.filter(followedUser => followedUser.id !== user.id);
  }
}

class Post {
  constructor(content) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.content = content;
    this.createdAt = new Date();
  }
}


const app = express();


const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
    email: String!
    posts: [Post!]!
    following: [User!]!
  }

  type Post {
    id: ID!
    content: String!
    createdAt: String!
  }

  type Query {
    user(id: ID!): User
    posts(userId: ID!): [Post!]!
  }

  type Mutation {
    createUser(username: String!, email: String!, password: String!): User
    createPost(userId: ID!, content: String!): Post
    followUser(userId: ID!, followUserId: ID!): User
    unfollowUser(userId: ID!, unfollowUserId: ID!): User
  }
`);

const users = [];
const posts = [];


const root = {
  createUser: ({ username, email, password }) => {
    const user = users.find(user => user.email == email);
    if (user) {
      throw new Error('This email is allready registered.');
    }
    const newUser = new User(users.length + 1, username, email, password);
    users.push(newUser);
    return newUser;
  },
  createPost: ({ userId, content }) => {
    console.log(typeof userId)
    const user = users.find(user => user.id == userId);
    if (!user) {
      throw new Error('User not found');
    }
    const post = user.addPost(content);
    posts.push(post);
    return post;
  },
  followUser: ({ userId, followUserId }) => {
    const user = users.find(user => user.id == userId);
    const followUser = users.find(user => user.id == followUserId);
    if (!user || !followUser) {
      throw new Error('User not found');
    }
    user.follow(followUser);
    return user;
  },
  unfollowUser: ({ userId, unfollowUserId }) => {
    const user = users.find(user => user.id == userId);
    const unfollowUser = users.find(user => user.id == unfollowUserId);
    if (!user || !unfollowUser) {
      throw new Error('User not found');
    }
    user.unfollow(unfollowUser);
    return user;
  },
  user: ({ id }) => users.find(user => user.id == id),
  posts: ({ userId }) => {
    const user = users.find(user => user.id == userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.posts;
  }
};

app.get('/', (req,res)=>{
    res.send("Hello you reach to server..")
})

app.get('/allusers', (req,res)=>{
    res.send(users);
})

// Setup GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
