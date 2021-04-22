import { firebase } from "../../firebase/firebase";

export const actions = {
  SET_IS_LOADING: "set_id_loading",
  FETCH_FEED: "fetch_feed",
  HANDLE_AGREE: "handle_agree",
  HANDLE_UNDO_AGREE: "handle_undo_agree",
  HANDLE_DISAGREE: "handle_disagree",
  HANDLE_UNDO_DISAGREE: "handle_undo_disagree",
  HANDLE_ADD_COMMENT: "handle_add_comment",
  HANDLE_LOAD_COMMENTS: "handle_load_comments",
  HANDLE_FETCH_POSTS: "handle_fetch_posts",
  REPLY_TO_COMMENT: "reply_to_comment",
  FETCH_HEADLINES: "fetch_headlines",
  FETCH_POLITICIAN_NEWS: "fetch_politician_news",
};

export function setIsLoading(value) {
  return (dispatch) => {
    dispatch({
      type: actions.SET_IS_LOADING,
      data: {
        isLoading: value,
      },
    });
  };
}

export function fetchFeed() {
  return (dispatch) => {
    // fetch current user
    const currentUser = firebase.auth().currentUser;

    //fetch current user's media and interest from firebase
    firebase
      .firestore()
      .collection("users")
      .doc(currentUser.uid)
      .get()
      .then((doc) => {
        const selectedMedias = doc.data().medias;
        const selectedInterests = doc.data().interests;

        if (selectedMedias.length === 0 || selectedInterests === 0) {
            dispatch({
              type: actions.FETCH_FEED,
              data: {
                newsfeed: []
              },
            });
        } else {
          // fetch news
          const fetchFeed = async () => {
            try {
              // call clound function fetchNews, with userToken (for cloud function to talk to db)
              const fetchNews = firebase.functions().httpsCallable("fetchNews");
              const userToken = await firebase
                .auth()
                .currentUser.getIdToken(true);

              const response = await fetchNews({
                medias: selectedMedias,
                interests: selectedInterests,
                userToken,
              });

              // articles (response) come back from cloud function (server): stories from NewsApi with userShares
              const newsfeed = response.data?.articles;

              dispatch({
                type: actions.FETCH_FEED,
                data: {
                  newsfeed,
                },
              });
            } catch (err) {
              console.error(err);
            }
          };

          fetchFeed();
        }
      });
  };
}

function idForStory(story) {
  return story?.url.trim().split("/").join("_");
}

function incrementField(type) {
  if (type === "agree") {
    return {
      numOfAgree: firebase.firestore.FieldValue.increment(1),
    };
  } else if (type === "undo-agree") {
    return {
      numOfAgree: firebase.firestore.FieldValue.increment(-1),
    };
  } else if (type === "disagree") {
    return {
      numOfDisagree: firebase.firestore.FieldValue.increment(1),
    };
  } else if (type === "undo-disagree") {
    return {
      numOfDisagree: firebase.firestore.FieldValue.increment(-1),
    };
  } else if (type === "add-comment") {
    return {
      numOfComment: firebase.firestore.FieldValue.increment(1),
    };
  }
}

async function saveStory(
  storyID,
  {
    author,
    content,
    description,
    numOfAgree,
    numOfComment,
    numOfDisagree,
    publishedAt,
    source,
    title,
    url,
    urlToImage,
    userDidAgree,
    userDidDisagree,
    userDidComment,
  }
) {
  try {
    const storyDoc = await firebase
      .firestore()
      .collection("stories")
      .doc(storyID)
      .get();

    // if story has not been added
    if (!storyDoc.exists) {
      await firebase.firestore().collection("stories").doc(storyID).set({
        author,
        content,
        description,
        numOfAgree,
        numOfComment,
        numOfDisagree,
        publishedAt,
        source,
        title,
        url,
        urlToImage,
        userDidAgree,
        userDidDisagree,
        userDidComment,
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function addShare({ type, article, dispatch }) {
  const storyID = idForStory(article);
  const userID = firebase.auth().currentUser.uid;

  await saveStory(storyID, {
    ...article,
    numOfAgree: 0,
    numOfComment: 0,
    numOfDisagree: 0,
  });

  const shareObject = {
    type,
    storyID,
    userID,
    timestamp: Date.now(),
  };

  // if story has been added, increment story collection count
  const updateStoryPromise = firebase
    .firestore()
    .collection("stories")
    .doc(storyID)
    .update(incrementField(type));

  // entry to share colleciton
  const addSharePromise = firebase
    .firestore()
    .collection("shares")
    .add(shareObject);

  // dispatch action object to reducer
  try {
    await Promise.all([updateStoryPromise, addSharePromise]);
    // console.log("share written successfully");
    if (type === "agree") {
      dispatch({
        type: actions.HANDLE_AGREE,
        data: { shareObject, storyUrl: article.url },
      });
    } else if (type === "disagree") {
      dispatch({
        type: actions.HANDLE_DISAGREE,
        data: { shareObject, storyUrl: article.url },
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function deleteShare({ type, story, dispatch }) {
  const storyID = idForStory(story);
  const userID = firebase.auth().currentUser.uid;

  let shareQuery = {};

  if (type === "undo-agree") {
    shareQuery = firebase
      .firestore()
      .collection("shares")
      .where("storyID", "==", storyID)
      .where("userID", "==", userID)
      .where("type", "==", "agree");
  } else if (type === "undo-disagree") {
    shareQuery = firebase
      .firestore()
      .collection("shares")
      .where("storyID", "==", storyID)
      .where("userID", "==", userID)
      .where("type", "==", "disagree");
  }

  // delete share entry
  const querySnapshot = await shareQuery.get();
  querySnapshot.forEach(async (doc) => {
    await doc.ref.delete();
    // it is async and await, to make sure it is deleted before dispatch

    // dispatch action object to reducer
    if (type === "undo-agree") {
      dispatch({
        type: actions.HANDLE_UNDO_AGREE,
        data: { storyUrl: story.url },
      });
    } else if (type === "undo-disagree") {
      dispatch({
        type: actions.HANDLE_UNDO_DISAGREE,
        data: { storyUrl: story.url },
      });
    }
  });

  // decrement story collection count
  firebase
    .firestore()
    .collection("stories")
    .doc(storyID)
    .update(incrementField(type));
}

export function handleAgree({ feedForComment, type }) {
  return (dispatch) => {
    if (type === "agree") {
      // add entry to share collection and increment story collection agree count
      addShare({
        type: "agree",
        article: feedForComment,
        dispatch,
      });
    } else if (type === "undo-agree") {
      // remove entry to share collection and decrement story collection agree count
      deleteShare({
        type: "undo-agree",
        story: feedForComment,
        dispatch,
      });
    }
  };
}

export function handleDisagree({ feedForComment, type }) {
  return (dispatch) => {
    if (type === "disagree") {
      addShare({
        type: "disagree",
        article: feedForComment,
        dispatch,
      });
    } else if (type === "undo-disagree") {
      deleteShare({
        type: "undo-disagree",
        story: feedForComment,
        dispatch,
      });
    }
  };
}

async function addComment({ type, content, article, authorName, dispatch }) {
  console.log({ authorName });
  console.log({ content });
  const storyID = idForStory(article);
  const userID = firebase.auth().currentUser.uid;

  await saveStory(storyID, {
    ...article,
    numOfAgree: 0,
    numOfComment: 0,
    numOfDisagree: 0,
  });

  const commentObject = {
    content,
    storyID,
    userID,
    timestamp: Date.now(),
  };

  // if story has been added, increment story collection count
  const updateStoryPromise = firebase
    .firestore()
    .collection("stories")
    .doc(storyID)
    .update(incrementField(type));

  const shareObject = {
    type: "comment",
    storyID,
    userID,
    timestamp: Date.now(),
  };

  // entry to shares collection
  const addSharePromise = firebase
    .firestore()
    .collection("shares")
    .add(shareObject);

  // entry to comment collection
  const addCommentPromise = firebase
    .firestore()
    .collection("comments")
    .add(commentObject);

  // dispatch action object
  try {
    const [doc, ref] = await Promise.all([
      updateStoryPromise,
      addCommentPromise,
      addSharePromise,
    ]);
    console.log("comment written successfully", doc);
    dispatch({
      type: actions.HANDLE_ADD_COMMENT,
      data: {
        commentObject,
        commentID: ref.id,
        storyUrl: article.url,
        authorName,
      },
    });
  } catch (err) {
    console.log(err);
  }
}

export function handleAddComment({
  feedForComment,
  commentContent,
  authorName,
}) {
  // console.log(feedForComment);
  // console.log(commentContent);

  return (dispatch) => {
    addComment({
      type: "add-comment",
      content: commentContent,
      article: feedForComment,
      authorName,
      dispatch,
    });
  };
}

export function handleLoadComments({ storyID, storyUrl }) {
  return (dispatch) => {
    const fetchAllComments = async (storyID) => {
      // console.log("user: ", firebase.auth().currentUser);
      if (firebase.auth().currentUser == null) {
        return;
      }

      try {
        // call clound function fetchComments
        const fetchComments = firebase
          .functions()
          .httpsCallable("fetchComments");
        const userToken = await firebase.auth().currentUser.getIdToken(true);

        const response = await fetchComments({
          storyID: storyID,
          userToken,
        });

        const loadedComments = response.data.comments;
        // console.log({ loadedComments });

        dispatch({
          type: actions.HANDLE_LOAD_COMMENTS,
          data: {
            loadedComments,
            storyUrl,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllComments(storyID);
  };
}

export function handleFetchPosts() {
  return (dispatch) => {
    const fetchUserPosts = async () => {
      try {
        const fetchPosts = firebase.functions().httpsCallable("fetchPosts");

        const userToken = await firebase.auth().currentUser.getIdToken(true);
        // console.log(userToken);

        //call clound function fetchPosts, with user token
        const response = await fetchPosts({ userToken });
        // console.log({ response });

        const posts = response.data.posts;
        // console.log({ posts });

        dispatch({
          type: actions.HANDLE_FETCH_POSTS,
          data: {
            posts,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserPosts();
  };
}

export function replyToComment({
  storyID,
  rootCommentID,
  inputValue,
  authorName,
}) {
  // console.log({ storyID, rootCommentID, inputValue });

  const userID = firebase.auth().currentUser.uid;
  const storyUrl = storyID.split("_").join("/");

  return async (dispatch) => {
    const replyObject = {
      content: inputValue,
      userID,
      storyID,
      timestamp: Date.now(),
      replyTo: {
        rootCommentID,
      },
    };

    // entry to comments table
    const updateCommentsPromise = firebase
      .firestore()
      .collection("comments")
      .add(replyObject);

    const updateStoryPromise = firebase
      .firestore()
      .collection("stories")
      .doc(storyID)
      .update({
        numOfComment: firebase.firestore.FieldValue.increment(1),
      });

    try {
      await Promise.all([updateCommentsPromise, updateStoryPromise]);
      dispatch({
        type: actions.REPLY_TO_COMMENT,
        data: { replyObject, storyUrl, authorName },
      });
    } catch (err) {
      console.error(err);
    }
  };
}

export function fetchHeadlines() {
  return (dispatch) => {
    // fetch news
    const fetchHeadlinesFromNewsApi = async () => {
      try {
        // call clound function  fetchHeadlinesFromNewsApi, with userToken (for cloud function to talk to db)
        const fetchHeadlinesFromNewsApi = firebase
          .functions()
          .httpsCallable("fetchHeadlinesFromNewsApi");

        const response = await fetchHeadlinesFromNewsApi({});

        // articles (response) come back from cloud function (server): headlines from NewsApi
        const headlines = response.data.articles;
        // console.log({ headlines });

        dispatch({
          type: actions.FETCH_HEADLINES,
          data: {
            headlines,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchHeadlinesFromNewsApi();
  };
}

export function fetchPoliticianNews(officialName) {
  return (dispatch) => {
    // fetch news
    const fetchPoliticianNewsFromNewsApi = async () => {
      try {
        const fetchPoliticianNewsFromNewsApi = firebase
          .functions()
          .httpsCallable("fetchPoliticianNewsFromNewsApi");

        const response = await fetchPoliticianNewsFromNewsApi({
          officialName: officialName,
        });

        // articles (response) come back from cloud function (server): headlines from NewsApi
        const politicianNews = response.data.articles;

        dispatch({
          type: actions.FETCH_POLITICIAN_NEWS,
          data: {
            politicianNews,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchPoliticianNewsFromNewsApi();
  };
}