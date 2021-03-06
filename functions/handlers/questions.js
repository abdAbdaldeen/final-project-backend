const { db, admin } = require("../util/admin");

exports.add = async (req, res) => {
  db.doc("/coins/" + req.user.uid)
    .get()
    .then((doc) => {
      if (doc.data().coins >= 5) {
        db.doc("/coins/" + req.user.uid)
          .update({ coins: doc.data().coins - 5 })
          .then(() => {
            const newQuestion = {
              userID: req.user.uid,
              groupID: req.body.groupID,
              title: req.body.title,
              body: req.body.body,
              createdAt: new Date().toISOString(),
              votesCount: 0,
              reportsCount: 0,
            };
            let id = newQuestion.title.replace(/ /g,'-')
            db.collection("questions").doc().set(newQuestion)
              .then((doc) => {
                const resQuestion = newQuestion;
                resQuestion.qID = doc.id;
                res.json(resQuestion);
              });
          });
      } else
        return res.status(244).json({ error: "عملاتك لا تكفي لاضافة سؤال" });
    })
    .catch(function (error) {
      console.error(error);
      res.status(255).json({
        error: "حدث خطأ اثناء اضافة السؤال، الرجاء المحاولة مرة اخرى",
      });
    });
};
// ============================================================
exports.getFirst = (req, res) => {
  db.collection("questions")
    .where("groupID", "==", req.params.groupID)
    .orderBy("createdAt", "desc")
    .limit(6)
    .get()
    .then((data) => {
      let questions = [];
      let lastKey = "";
      data.forEach((doc) => {
        questions.push({
          qID: doc.id,
          ...doc.data(),
        });
        lastKey = doc.data().createdAt;
      });
      return res.json({ questions, lastKey });
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};
exports.getMore = (req, res) => {
  db.collection("questions")
    .where("groupID", "==", req.body.groupID)
    .orderBy("createdAt", "desc")
    .startAfter(req.body.key)
    .limit(6)
    .get()
    .then((data) => {
      let questions = [];
      let lastKey = "";
      data.forEach((doc) => {
        questions.push({
          qID: doc.id,
          ...doc.data(),
        });
        lastKey = doc.data().createdAt;
      });
      return res.json({ questions, lastKey });
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};
// ============================================================
// ============================================================
exports.getAllFirst = (req, res) => {
  db.collection("questions")
    .orderBy("createdAt", "desc")
    .limit(6)
    .get()
    .then((data) => {
      let questions = [];
      let lastKey = "";
      data.forEach((doc) => {
        questions.push({
          qID: doc.id,
          ...doc.data(),
        });
        lastKey = doc.data().createdAt;
      });
      return res.json({ questions, lastKey });
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};
exports.getAllMore = (req, res) => {
  db.collection("questions")
    .orderBy("createdAt", "desc")
    .startAfter(req.body.key)
    .limit(6)
    .get()
    .then((data) => {
      let questions = [];
      let lastKey = "";
      data.forEach((doc) => {
        questions.push({
          qID: doc.id,
          ...doc.data(),
        });
        lastKey = doc.data().createdAt;
      });
      return res.json({ questions, lastKey });
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};
// ============================================================

exports.getOne = (req, res) => {
  let answers = [];
  db.collection("questions")
    .doc(req.params.qID)
    .get()
    .then((doc) => {
      const resQuestion = doc.data();
      resQuestion.qID = doc.id;

      db.collection("answers")
        .where("questionID", "==", doc.id)
        .orderBy("votesCount", "desc")
        .get()
        .then(async (data) => {
          data.forEach(async (answerDoc) => {
            answers.push({
              aID: answerDoc.id,
              ...answerDoc.data(),
            });
          });
        })
        .then(() => {
          console.log("2 finished");
          resQuestion.answers = answers;
          return res.json(resQuestion);
        });
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};
exports.getOneLoggedIn = (req, res) => {
  let answers = [];
  db.collection("questions")
    .doc(req.params.qID)
    .get()
    .then((doc) => {
      const resQuestion = doc.data();
      resQuestion.qID = doc.id;
      // ==============
      db.collection("votes")
        .where("docID", "==", doc.id)
        .where("userID", "==", req.user.uid)
        .get()
        .then((snapshot) => {
          if (snapshot.empty) {
            resQuestion.uVote = 0;
          }
          snapshot.forEach((doc) => {
            resQuestion.uVote = doc.data().vote;
          });
        });
      // ==============
      db.collection("answers")
        .where("questionID", "==", doc.id)
        // .orderBy('createdAt', "desc")
        .get()
        .then(async (data) => {
          let i = 0;
          if (!data.empty) {
            data.forEach(async (answerDoc) => {
              i++;
              let v = 0;
              db.collection("votes")
                .where("docID", "==", answerDoc.id)
                .where("userID", "==", req.user.uid)
                .get()
                .then((snapshot) => {
                  if (!snapshot.empty) {
                    snapshot.forEach((doc) => {
                      v = doc.data().vote;
                    });
                  }
                })
                .then(() => {
                  answers.push({
                    aID: answerDoc.id,
                    uVote: v,
                    ...answerDoc.data(),
                  });
                })
                .then(() => {
                  if (data.size == answers.length) {
                    console.log(data.size);
                    resQuestion.answers = answers;
                    return res.json(resQuestion);
                  }
                });
            });
          } else {
            resQuestion.answers = [];
            return res.json(resQuestion);
          }
        })
        .then(() => {
          console.log("2 finished");
        });
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};
exports.deleteQ = (req, res) => {
  let qDoc = db.collection("questions").doc(req.body.qID);
  //check if the user is owner of question
  qDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        if (req.user.uid == doc.data().userID) {
          // update question
          qDoc.delete().then(() => {
            return res.json("Successfully delete question");
          });
        } else {
          return res.status(403).json("Unauthorized");
        }
      }
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};

exports.update = (req, res) => {
  let qDoc = db.collection("questions").doc(req.body.qID);

  //check if the user is owner of question
  qDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        if (req.user.uid == doc.data().userID) {
          // update question
          qDoc
            .update({
              titel: req.body.titel,
              body: req.body.body,
            })
            .then(() => {
              return res.json("Successfully update question");
            });
        } else {
          return res.status(403).json("Unauthorized");
        }
      }
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};
