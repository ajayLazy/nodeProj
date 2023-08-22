const express = require("express");
const app = express();
const port = 8200 || process.env.PORT;
var cors = require("cors");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { Configuration, OpenAIApi } = require("openai");
const crypto = require("crypto");
var cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
var admin = require("firebase-admin");
const axios = require("axios");
const { faqcompanies } = require("./faqcompanies");
const { faqs } = require("./faqs");
console.log("ok");
var aws = require("aws-sdk");
var sendpulse = require("sendpulse-api");
const referralCodes = require("./referralCodes.json");
const { coupanCodes } = require("./coupanCode.js");
const { coverLetterCodes } = require("./coupanCodeCoverLetter.js");
const v2Routes = require("./v2routes.js");
const stripe = require("stripe")(
  "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"
);
const stripe1 = require("stripe")(
  "sk_test_51JByccSBv8rKlDgOiRt4IkKBfixtI3f140KMlQVQnSfdyFbf75y5vHJhVqlmaLj2wpoXZCQWBUHyVMwIM70lYBr700WQip007e"
);
const { indeedContent } = require("./indeed-content.js");
const { ziprecruiterContent } = require("./ziprecruiter-content");
const { linkedinContent } = require("./linkedin-content.js");

const FirstpromoterApiNode = require("firstpromoter-api-node");
const firstpromoterApiNode = new FirstpromoterApiNode({
  key: "df5a120aeab2a21666d4a8649251498c",
});
const fs = require("fs");
var Mixpanel = require("mixpanel");
const fetch = require("node-fetch");
const { createCanvas, registerFont } = require("canvas");
const Typesense = require("typesense");
// create an instance of the mixpanel client
var mixpanel = Mixpanel.init("e62b22a7f7ad407a16a31ee99ddf8a09");

var os = require("os");
const util = require("util");
const writeFile = util.promisify(fs.writeFile);

// get config vars
dotenv.config();
app.use(cookieParser());
const { v4: uuidv4 } = require("uuid");
var bodyParser = require("body-parser");
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

var API_USER_ID = process.env.SENDPULSE_ID;
var API_SECRET = process.env.SENDPULSE_SECRET;
var TOKEN_STORAGE = "/tmp/";

sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, function () {
  console.log("Sendpulse Initialized");
});

const clientTypesense = new Typesense.Client({
  nodes: [
    {
      host: "ktfr69c5hzpsvieap-1.a1.typesense.net",
      port: "443",
      protocol: "https",
    },
    {
      host: "ktfr69c5hzpsvieap-2.a1.typesense.net",
      port: "443",
      protocol: "https",
    },
    {
      host: "ktfr69c5hzpsvieap-3.a1.typesense.net",
      port: "443",
      protocol: "https",
    },
  ],
  apiKey: process.env.TYPESENSEAPI,
  numRetries: 3, // A total of 4 tries (1 original try + 3 retries)
  connectionTimeoutSeconds: 60,
  logLevel: "debug",
});

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook" || req.originalUrl === "/webhooknew") {
    next();
  } else {
    express.json({ limit: "50mb" })(req, res, next);
  }
});

// app.use(cors("Access-Control-Allow-Origin", "*"));
app.use(cors());
const mailingjson = {
  paidusers: 178679,
  cardabandon: 178680,
  stripe: 178681,
  razorpay: 178684,
  mobileusers: 178691,
  freetrial: 178693,
  jobsapplied: 318700,
};

app.post("/sendemail", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const cover = req.body.coverletter;
  const maintext = req.body?.maintext || "Cover Letter";
  var emailobj = {
    text: cover,
    subject: maintext,
    from: {
      name: "Vivek",
      email: "vivek@lazyapply.com",
    },
    to: [
      {
        name: name,
        email: email,
      },
    ],
  };
  var answerGetter = (data) => {
    console.log(data, "data");
    res.send("success");
  };
  sendpulse.smtpSendMail(answerGetter, emailobj);
});

app.post("/addEmailToSendPulse", (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const mailingListId = req.body.id;
  let variables = {};
  if ("name" in req.body) {
    variables.name = req.body.name;
  }
  if ("feedback" in req.body) {
    variables.feedback = req.body.feedback;
  }
  if ("feedbacktext" in req.body) {
    variables.feedbacktext = req.body.feedbacktext;
  }
  var answerGetter = (data) => {
    console.log(data, "data");
    res.send("success");
  };
  const executeRemove = () => {
    console.log("execute remove");
    if (mailingListId == mailingjson.paidusers) {
      removeEmailFromId(email, mailingjson.cardabandon);
      removeEmailFromId(email, mailingjson.mobileusers);
      removeEmailFromId(email, mailingjson.freetrial);
      removeEmailFromId(email, mailingjson.razorpay);
      removeEmailFromId(email, mailingjson.stripe);
      fetch(
        "https://events.sendpulse.com/events/id/ea1db903088f49e6d74c2c52036b603b/7948433",
        {
          method: "POST",
          body: JSON.stringify({
            email: email,
            phone: "+123456789",
          }),
          headers: { "Content-Type": "application/json" },
        }
      )
        .then((res) => res.json())
        .then((json) => console.log("remove from automation", json));
    } else if (mailingListId == mailingjson.freetrial) {
      removeEmailFromId(email, mailingjson.mobileusers);
      fetch(
        "https://events.sendpulse.com/events/id/64bffd1ddfd8495ab5425d7991d1d4ce/7948433",
        {
          method: "POST",
          body: JSON.stringify({
            email: email,
            phone: "+123456789",
          }),
          headers: { "Content-Type": "application/json" },
        }
      )
        .then((res) => res.json())
        .then((json) => console.log("remove from automation", json));
    }
  };
  executeRemove();
  sendpulse.addEmails(answerGetter, mailingListId, [
    { email: email, variables: variables },
  ]);
});

const addmailingfn = (email, mailingListId, data = {}) => {
  var answerGetter = (data) => {
    console.log(data, "data done");
  };
  sendpulse.addEmails(answerGetter, mailingListId, [
    { email: email, variables: data },
  ]);
  const executeRemove = () => {
    console.log("execute remove");
    if (mailingListId == mailingjson.paidusers) {
      removeEmailFromId(email, mailingjson.cardabandon);
      removeEmailFromId(email, mailingjson.mobileusers);
      removeEmailFromId(email, mailingjson.freetrial);
      removeEmailFromId(email, mailingjson.razorpay);
      removeEmailFromId(email, mailingjson.stripe);
      fetch(
        "https://events.sendpulse.com/events/id/ea1db903088f49e6d74c2c52036b603b/7948433",
        {
          method: "POST",
          body: JSON.stringify({
            email: email,
            phone: "+123456789",
          }),
          headers: { "Content-Type": "application/json" },
        }
      )
        .then((res) => res.json())
        .then((json) => console.log("remove from automation", json));
    } else if (mailingListId == mailingjson.freetrial) {
      removeEmailFromId(email, mailingjson.mobileusers);
      fetch(
        "https://events.sendpulse.com/events/id/64bffd1ddfd8495ab5425d7991d1d4ce/7948433",
        {
          method: "POST",
          body: JSON.stringify({
            email: email,
            phone: "+123456789",
          }),
          headers: { "Content-Type": "application/json" },
        }
      )
        .then((res) => res.json())
        .then((json) => console.log("remove from automation", json));
    }
  };
  executeRemove();
};

const removeEmailFromId = (email, id) => {
  var answerGetter = (data) => {
    if ("error_code" in data) {
      console.log("no such email present", data);
    } else {
      sendpulse.removeEmails(answerGetter1, id, [email]);
    }
  };
  var answerGetter1 = async (data) => {
    console.log(data, "remove email");
  };
  sendpulse.getEmailInfo(answerGetter, id, email);
};
// console.log("process env", process.env);
let mainaccount = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  },
  "mainaccountfirebase"
);

let secondaryaccount = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID1,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL1,
      privateKey: process.env.FIREBASE_PRIVATE_KEY1.replace(/\\n/g, "\n"),
    }),
  },
  "secondaryaccountfirebase"
);

const dbFree = secondaryaccount.firestore();
const db = mainaccount.firestore();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log("error", err, user);

    if (err) return res.status(403).send({ error: "not authorised" });
    req.user = user;
    next();
  });
}

function generateAccessToken(username, email) {
  return jwt.sign({ name: username, email: email }, process.env.TOKEN_SECRET, {
    expiresIn: "14d",
  });
}

app.get("/", (req, res) => {
  res.send("success, lazyapply backend");
});

app.post("/linkwithbnpl", async (req, res) => {
  const paymentid = req.body.paymentid;
  const paymentData = req.body.paymentData;
  let planName = req.body.planName;
  const email = paymentData.email;
  const FieldValue = admin.firestore.FieldValue;
  const customer = await stripe.customers.create({
    name: paymentData.name,
    address: paymentData.address,
    payment_method: paymentid,
    email: email,
    phone: paymentData.phone,
    invoice_settings: {
      default_payment_method: paymentid,
    },
  });
  var mainRef;
  const uuid = uuidv4();
  mainRef = db.collection("bnpl").doc(email);
  mainRef
    .set(
      {
        [uuid]: {
          paymentid: paymentid,
          customer: customer,
          customerid: customer.id,
          paymentData: paymentData,
          planName: planName,
          createdAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    )
    .then(function () {
      const mainRef1 = db.collection("users").doc(email);
      mainRef1
        .get()
        .then(function (docRef) {
          if (docRef.exists) {
            let monthlyLimit;
            let dailyLimit;
            if (planName == "basic") {
              planName = "basic";
              monthlyLimit = 12000;
              dailyLimit = 150;
            } else if (planName == "premium") {
              planName = "premium";
              monthlyLimit = 22500;
              dailyLimit = 750;
            } else if (planName == "unlimited") {
              planName = "unlimited";
              monthlyLimit = 300000;
              dailyLimit = 100000;
            }
            let startDate = new Date();
            let endDate = new Date().setDate(startDate.getDate() + 365);
            const finalPlanDetails = {
              endDate: new Date(endDate),
              startDate,
              planName,
              monthlyLimit,
              dailyLimit,
              planStarted: 1,
            };
            const idnew = email + "v2Id";
            if (planName == "premium") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 5;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            } else if (planName == "unlimited") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 10;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            }

            mainRef1
              .update({
                planDetails: finalPlanDetails,
              })
              .then(() => {
                res.send("successfully linkedin");
                console.log("success for plan update on email", email);
              })
              .catch((e) => {
                res.send("successfully linkedin");
                console.log("firebase plan update error for email", email);
              });
          } else {
            console.log("err1");
            res.send("successfully linkedin");
          }
        })
        .catch((err) => {
          console.log("err0", err);
          res.status(400).json({ error: "Something went wrong" });
        });
    })
    .catch((err) => {
      console.log("err", err);
      res.status(400).json({ error: "Something went wrong" });
    });
});

// const paymentProcess = async (
//   planName,
//   paymentid,
//   customerid,
//   email,
//   mainid,
//   maindata
// ) => {
//   try {
//     let amount = 0;
//     if (planName === "basic") {
//       amount = 9900;
//     } else if (planName === "premium") {
//       amount = 12900;
//     } else if (planName === "unlimited") {
//       amount = 19900;
//     } else {
//       amount = 0;
//     }
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency: "usd",
//       description: `${planName} plan bnpl`,
//       customer: customerid,
//       payment_method: paymentid,
//       error_on_requires_action: true,
//       confirm: true,
//     });
//     console.log("paymentintent", paymentIntent);
//     const mainRef = db.collection("bnpl").doc(email);
//     const res = await mainRef.set(
//       {
//         ...maindata,
//         [mainid]: {
//           ...maindata[mainid],
//           paymentstatus: 1,
//         },
//       },
//       { merge: true }
//     );
//     console.log("res success", res);
//   } catch (err) {
//     // Error code will be authentication_required if authentication is needed
//     console.log("Error code is: ", err);
//     const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(
//       err.raw.payment_intent.id
//     );
//     console.log("PI retrieved: ", paymentIntentRetrieved.id);
//   }
// };

// app.get("/paisakaat/:email", async (req, res) => {
//   const email = req.params["email"];
//   const id = req.query["id"];
//   const mainRef = db.collection("bnpl").doc(email);
//   mainRef
//     .get()
//     .then(async function (docRef) {
//       console.log("doc");
//       const length = Object.keys(docRef.data()).length;
//       if (length === 1) {
//         Object.keys(docRef.data()).forEach(async (key) => {
//           const data = docRef.data()[key];
//           const customerId = data.customerid;
//           const paymentId = data.paymentid;
//           const planName = data.planName;
//           const paymentstatus = data?.paymentstatus;
//           console.log("data", planName, paymentId, customerId);
//           if (!paymentstatus || paymentstatus != 1) {
//             await paymentProcess(
//               planName,
//               paymentId,
//               customerId,
//               email,
//               key,
//               docRef.data()
//             );
//           }
//         });
//       } else {
//         if (id) {
//           const data = docRef.data()[id];
//           const customerId = data.customerid;
//           const paymentId = data.paymentid;
//           const planName = data.planName;
//           const paymentstatus = data?.paymentstatus;
//           console.log("data", planName, paymentId, customerId);
//           if (!paymentstatus || paymentstatus != 1) {
//             await paymentProcess(
//               planName,
//               paymentId,
//               customerId,
//               email,
//               id,
//               docRef.data()
//             );
//           }
//         } else {
//           console.log("id not present");
//         }
//       }
//       res.send("success");
//     })
//     .catch((err) => {
//       console.log("err", err);
//       res.send("error");
//     });
// });

app.get("/data", authenticateToken, (req, res) => {
  const mainRef = db.collection("debugReport");
  mainRef
    .get()
    .then((docRef) => {
      const r = docRef.docs;
      const tempDoc = r.map((doc) => {
        console.log("data", doc);
        return { id: doc.id, ...doc.data() };
      });
      let newobj = {};
      tempDoc.forEach((value) => {
        const email = value.id;
        newobj[email] = value;
      });
      fs.writeFileSync("finaljson.json", JSON.stringify(newobj));
      res.send("success");
    })
    .catch((err) => {
      res.send("err");
      console.log("some error", err);
    });
});

app.get("/indeed-content/ids", (req, res) => {
  res.send(indeedContent);
});

app.get("/linkedin-content/ids", (req, res) => {
  res.send(linkedinContent);
});

app.get("/ziprecruiter-content/ids", (req, res) => {
  res.send(ziprecruiterContent);
});

app.all(
  "/presignedurl/debug/:platform",
  authenticateToken,
  async (req, res) => {
    const platform = req.params["platform"];
    const s3 = new aws.S3({
      region: "ap-south-1",
      accessKeyId: "AKIAXUEEQ6FOV7SDN674",
      secretAccessKey: "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",
    });
    const id = uuidv4();
    const s3Params = {
      Bucket: "code-bucket-lazyapply",
      Key: `${req.user.email}/${platform}_${id}_file.html`,
      Expires: 60 * 60,
      ContentType: "text/html",
    };

    const url = await getPresignUrlPromiseFunction(s3, s3Params);
    console.log("url", url);
    if (url) {
      res.send({ url: url });
    } else {
      res.send({ error: "error" });
    }
  }
);

app.get("/debug/:email/:flag", (req, res) => {
  const flag = req.params["flag"];
  const mainflag = flag === "true";
  const email = req.params["email"];
  const mainRef = db.collection("users").doc(email);
  mainRef
    .set(
      {
        debug: mainflag,
      },
      { merge: true }
    )
    .then((r) => {
      res.send(`debug flag set to ${flag}`);
    })
    .catch((error) => {
      res.send("some error occured");
    });
});

app.all("/presignedurl/:page", authenticateToken, async (req, res) => {
  const page = req.params["page"];
  const s3 = new aws.S3({
    region: "ap-south-1",
    accessKeyId: "AKIAXUEEQ6FOV7SDN674",
    secretAccessKey: "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",
  });
  const s3Params = {
    Bucket: "code-bucket-lazyapply",
    Key: `${req.user.email}_${page}_file.html`,
    Expires: 60 * 60,
    ContentType: "text/html",
  };

  const url = await getPresignUrlPromiseFunction(s3, s3Params);
  console.log("url", url);
  if (url) {
    res.send({ url: url });
  } else {
    res.send({ error: "error" });
  }
});

const getheading = async (title) => {
  let finaltext = `Find the main heading for the title given below from the list of main headings. if title is not valid return 0\nmainheadins - [\n  'human resources & management & leadership',\n  'education & learning',\n  'information technology (it)',\n  'engineering & scientific',\n  'administrative',\n  'marketing & sales',\n  'business',\n  'sales & marketing',\n  'customer service',\n  'accounting & finance',\n  'retail & customer service',\n  'healthcare & medicine & wellbeing',\n  'creative & cultural fields',\n  'safety & security',\n  'frontend',\n  'government and ngos',\n  'transportation',\n  'fire fighting & law enforcement & emergency',\n  'construction',\n  'medical',\n  'janitorial & manufacturing & warehousing',\n  'food service',\n  'hotel & hospitality & travel & transportation',\n  'data science',\n  'legal',\n  'research',\n  'finance & banking',\n  'finance & accounting',\n  'management & leadership',\n  'manufacturing & warehousing',\n  'research & development',\n  'environmental & sustainability',\n  'quality assurance & quality control',\n  'data science & data analytics',\n  'consulting & business analysis',\n  'logistics & supply chain management',\n  'project management',\n  'banking & financial services',\n  'software development & programming',\n  'international development & relief',\n  'legal & legal services',\n  'other'\n]\ntitle - digital marketing\nsales & marketing\n##\ntitle - Dean\neducation & learning\n##\ntitle - fewfweif\n0\n##\ntitle - abc\n0\n##\ntitle - ${title}\n`;
  const openai = new OpenAIApi(configuration);
  const data = await new Promise(async (res, rej) => {
    try {
      const data = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: finaltext,
        temperature: 0.7,
        max_tokens: 1068,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      const replacerFunc = () => {
        const visited = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (visited.has(value)) {
              return;
            }
            visited.add(value);
          }
          return value;
        };
      };

      const x = JSON.stringify(data, replacerFunc());
      const heading = JSON.parse(x)?.data?.choices[0].text;
      res(heading);
    } catch (err) {
      console.log("err in openai", err?.message, err?.code);
      res("");
    }
  });
  return data;
};

// app.get("/getallcoverletter", (req, res) => {
//   const mainRef = db.collection("coverletters");
//   mainRef.get().then(function (docRef) {
//     console.log(docRef);
//     const r = docRef.docs;
//     const tempDoc = r.map((doc) => {
//       return { id: doc.id, ...doc.data() };
//     });
//     fs.writeFileSync("allcover.js", JSON.stringify(tempDoc), (err, data) => {
//       if (!err) {
//         console.log("data", data);
//       }
//     });
//     res.send({ message: "sucess" });
//   });
// });

// app.get("/getallcoverletter", (req, res) => {
//   const ref = db.collection("coverletters");
//   try {
//     ref.get().then((docRef) => {
//       console.log(docRef.docs);
//       let ids = [];
//       docRef.docs.forEach((doc) => {
//         console.log(doc.id);
//         ids.push(doc.id);
//       });
//       fs.writeFileSync("coverIds.js", JSON.stringify(ids), (err, data) => {
//         if (err) {
//           console.log("err", err);
//         } else {
//           console.log("success");
//         }
//       });
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

const saveImageToAws = async (buffer, id) => {
  console.log("buffer", buffer);
  const buf = Buffer.from(buffer, "base64");
  const s3 = new aws.S3({
    region: "ap-south-1",
    accessKeyId: "AKIAXUEEQ6FOV7SDN674",
    secretAccessKey: "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",
  });

  const s3Params = {
    Bucket: "lazyapply-content",
    Key: `coverlettermainimages/images/${id}.png`,
    Expires: 60 * 60,
    ContentType: "image/png",
    Body: buf,
  };

  const ans = await new Promise((resolve, reject) => {
    s3.putObject(s3Params, function (err, result) {
      if (err) {
        resolve({ message: "error" });
      }
      if (result) {
        resolve({ message: "success" });
      }
    });
  });
  console.log("ans", ans);
  return ans.message;
};

app.get("/gettargetsearch", authenticateToken, async (req, res) => {
  var mainRef;
  const email = req.user.email;
  mainRef = db.collection("targetedsearch").doc(email);
  mainRef
    .get()
    .then(function (docRef) {
      if (docRef.exists) {
        res.send({ present: true, ...docRef.data() });
      } else {
        res.send({ present: false });
      }
    })
    .catch((err) => {
      console.log("err", err);
      res.status(400).json({ error: "Something went wrong" });
    });
});

// app.get("/getlazyapplyxresponse", async (req, res) => {
//   if (process.env.GETRESPONSELAZYAPPLYX == req.query["code"]) {
//     let array = {};
//     const answer = await new Promise((resolve, reject) => {
//       db.collection("v2collection")
//         .doc("targetSearchSessions")
//         .listCollections()
//         .then(async (snapshot) => {
//           for (let index = 0; index < snapshot.length; index++) {
//             const snaps = snapshot[index];
//             const collection = await db
//               .collection("v2collection")
//               .doc("targetSearchSessions")
//               .collection(snaps["_queryOptions"].collectionId)
//               .get();

//             if (
//               snaps["_queryOptions"].collectionId !=
//               "rahulghatode99@gmail.comv2Id"
//             ) {
//               collection.docs.forEach((doc) => {
//                 const data = doc.data();
//                 if (data.processCompleted === 1) {
//                   console.log("process completed");
//                   const email =
//                     snaps["_queryOptions"].collectionId.split("v2Id")[0];
//                   if (!(email in array)) {
//                     array[email] = [];
//                   }
//                   array[email].push(data.uniqueId);
//                 }
//               });
//             }
//           }
//           resolve(array);
//         })
//         .catch((error) => {
//           console.error(error);
//           resolve(array);
//         });
//     });
//     res.send(answer);
//   } else {
//     res.send({});
//   }
// });

app.post("/targetedsearchdata", authenticateToken, async (req, res) => {
  var mainRef;
  const email = req.user.email;
  const data = req.body.data;
  mainRef = db.collection("targetSearchUserDetails").doc(email);
  mainRef
    .set({ ...data }, { merge: true })
    .then(async function () {
      await db
        .collection("targetSearchUsers")
        .doc(email)
        .set({ detailsUpdated: 1, stepNo: 2 }, { merge: true });
      res.send("successfully updated");
    })
    .catch((err) => {
      console.log("err", err);
      res.status(400).json({ error: "Something went wrong" });
    });
});

app.all(
  "/targetedSearch/presignedurl/:uid",
  authenticateToken,
  async (req, res) => {
    const uuid = req.params["uid"];
    const s3 = new aws.S3({
      region: "ap-south-1",
      accessKeyId: "AKIAXUEEQ6FOV7SDN674",
      secretAccessKey: "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",
    });
    const s3Params = {
      Bucket: "targetedsearch",
      Key: `${req.user.email}/${uuid}_resume`,
      Expires: 60 * 60,
      ContentType: "application/pdf",
    };

    const url = await getPresignUrlPromiseFunction(s3, s3Params);
    console.log("url", url);
    if (url) {
      res.send({ url: url });
    } else {
      res.send({ error: "error" });
    }
  }
);

const allowedOrigins = [
  "https://lazyapply.com",
  "https://app.lazyapply.com",
  "https://*.rsme.io",
];

// Define a middleware function to check the Origin header
function verifyOriginHeader(req, res, next) {
  // Check if the Origin header is present in the request
  const originHeader = req.headers.origin;
  if (!originHeader) {
    return res.status(403).json({ message: "Origin header is required." });
  }
  // Check if the Origin header matches any of the allowed origins
  if (!isOriginAllowed(originHeader)) {
    return res.status(403).json({ message: "Invalid origin." });
  }
  // If the Origin header is present and matches an allowed origin, proceed with processing the request
  next();
}

function isOriginAllowed(origin) {
  for (let allowedOrigin of allowedOrigins) {
    if (allowedOrigin.includes("*")) {
      // If the allowed origin is a wildcard domain, use a regular expression to check if the origin matches
      const regex = new RegExp(
        `^${allowedOrigin.replace(".", "\\.").replace("*", ".*")}$`
      );
      if (regex.test(origin)) {
        return true;
      }
    } else {
      // If the allowed origin is not a wildcard domain, check if the origin exactly matches the allowed origin
      if (origin === allowedOrigin) {
        return true;
      }
    }
  }
  return false;
}

app.get("/resumegpt/presignedurl/:id", verifyOriginHeader, async (req, res) => {
  const uuid = req.params["id"];
  const s3 = new aws.S3({
    region: "ap-south-1",
    accessKeyId: "AKIAXUEEQ6FOV7SDN674",
    secretAccessKey: "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",
  });
  const s3Params = {
    Bucket: "chat-with-resume",
    Key: `${uuid}_resume`,
    Expires: 60 * 60,
    ContentType: "application/pdf",
  };

  const url = await getPresignUrlPromiseFunction(s3, s3Params);
  console.log("url", url);
  if (url) {
    res.send({ url: url, userid: uuid });
  } else {
    res.send({ error: "error" });
  }
});

const upload = multer({
  storage: multerS3({
    s3: new aws.S3({
      region: "ap-south-1",
      accessKeyId: "AKIAXUEEQ6FOV7SDN674",
      secretAccessKey: "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",
    }),
    bucket: "resume-tracker-lazyapply",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      console.log(req.body.userId);
      cb(null, `${req.body.userId}_resume`);
    },
  }),
});

app.post(
  "/resumeTrackerUploadFile",
  upload.fields([{ name: "file", maxCount: 1 }, { name: "userId" }]),
  async (req, res) => {
    console.log(req);
    if (req.files.file && req.files.file[0]) {
      // File was uploaded successfully
      const file = req.files.file[0];
      // File was uploaded successfully
      const userId = req.body.userId;
      console.log(userId);
      const createNewTracker = await db
        .collection("resumeTracker")
        .doc(userId)
        .set(
          {
            resumeUploaded: 1,
          },
          { merge: true }
        );
      res.status(200).send(`File uploaded successfully. ${file.location}`);
    } else {
      // An error occurred
      res.status(500).send("An error occurred while uploading the file");
    }
  }
);

// let history =[]
// app.get("/test", async (req, res) => {
//   const mainRef = dbFree.collection("resumegpt");
//   const documentReferences = await mainRef.listDocuments();
//   const documentIds = documentReferences.map((it) => it.id);
//   console.log(documentIds)
//   for (let index = 0; index < documentIds.length; index++) {
//     const id = documentIds[index];
//     const data = await mainRef.doc(id).get();
//     history.push({
//       id:id,
//       chatHistory:data.data().chatHistory
//     })
//   }
//   fs.writeFileSync("./resumegpt.json", JSON.stringify(history),((err,data)=>{
//     if(!err){
//       console.log('success')
//     }
//   }));
//   res.send('ok')
// });

app.post("/resumegpt/chat_history", verifyOriginHeader, async (req, res) => {
  const userId = req.body.userId;
  const chatHistory = req.body.chatHistory;
  const mainRef = dbFree.collection("resumegpt").doc(userId);
  mainRef
    .set(
      {
        chatHistory: chatHistory,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dateInTimezonE: new Date()
          .toLocaleDateString("en-US", {
            timeZone: "America/New_York",
          })
          .replace(/\//g, "-"),
      },
      { merge: true }
    )
    .then((r) => {
      res.send({ message: "success" });
    })
    .catch((error) => {
      console.log(error);
      res.send({ message: "error" });
    });
});

function getPresignUrlPromiseFunction(s3, s3Params) {
  return new Promise(async (resolve, reject) => {
    try {
      await s3.getSignedUrl("putObject", s3Params, function (err, data) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    } catch (error) {
      return reject(error);
    }
  }).catch((err) => {
    console.log("err", err);
  });
}

async function saleFpr(id, email, amount, plan) {
  let o = {
    email: email,
    event_id: id,
    amount: amount,
    plan: plan,
  };
  console.log(o);
  try {
    const r = await firstpromoterApiNode.post("track/sale", o);
    console.log(r);
    return r;
  } catch (err) {
    console.log("error", err);
  }
}

async function signUpFpr(fpr, email) {
  let o = {
    email: email,
    ref_id: fpr,
  };
  console.log(o);
  try {
    const r = await firstpromoterApiNode.post("track/signup", o);
    console.log(r);
    return r;
  } catch (err) {
    console.log("error", err);
  }
}

app.get("/pricingDetails", authenticateToken, (req, res) => {
  const mainRef = dbFree.collection("payments");
  mainRef
    .get()
    .then((r) => {
      console.log(r);
      let value = {};
      r.forEach((data) => {
        console.log("r", data.data());
        value[data.id] = data.data();
      });
      res.send(value);
    })
    .catch((error) => {
      console.log(error);
      res.send("error");
    });
});

app.post("/saveIp", (req, res) => {
  const ip = req.body.ip;
  const ipDetails = req.body.ipDetails;
  const mainRef = dbFree.collection("ipaddress").doc(ip);
  mainRef
    .set(
      {
        ip: ipDetails,
      },
      { merge: true }
    )
    .then((r) => {
      console.log("successfully saved ip", r);
      res.send(r);
    })
    .catch((error) => {
      console.log(error);
      res.send("error");
    });
});

app.get("/subscriptions", authenticateToken, async (req, res) => {
  // Simulate authenticated user. In practice this will be the
  // Stripe Customer ID related to the authenticated user.
  const customerId = "cus_JuYAHuLR73daQj";

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    expand: ["data.default_payment_method"],
  });

  res.json({ subscriptions });
});

app.post("/create-customer", authenticateToken, (req, res) => {
  db.collection("users")
    .doc(req.user.email)
    .get()
    .then(async (doc) => {
      console.log(req.body.form);
      if ("customerId" in doc.data()) {
        console.log("customer id present");
        res.send({
          customerId: doc.data().customerId,
          customerDetails: doc.data().customerDetails,
        });
      } else {
        // Create a new customer object
        const customer = await stripe.customers.create({
          email: req.body.email,
          ...req.body.form,
        });
        //set customer id
        // Save the customer.id in your database alongside your user.
        db.collection("users")
          .doc(req.user.email)
          .update({
            customerDetails: customer,
            customerId: customer.id,
          })
          .then(() => {
            console.log("saved in db");
            res.send({ customerId: customer.id, customerDetails: customer });
          })
          .catch((err) => {
            console.log("errr", err);
            res.send("error");
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.send("error");
    });
});

app.post("/addplanadmin", authenticateToken, (req, res) => {
  if (
    req.user.email === "vivekiitjcse@gmail.com" ||
    req.user.email === "prakhargupta.2106@gmail.com"
  ) {
    const email = req.body.email;
    const mainRef = db.collection("users").doc(email);
    let startDate = new Date();
    let endDate = new Date().setDate(startDate.getDate() + 365);
    const planDetails = {
      endDate: new Date(endDate),
      startDate,
      planName: "basic",
      monthlyLimit: 12000,
      dailyLimit: 150,
      planStarted: 1,
    };
    mainRef
      .get()
      .then((docRef) => {
        if (docRef.exists) {
          mainRef
            .set(
              {
                planDetails: planDetails,
              },
              { merge: true }
            )
            .then(() => {
              console.log("success for plan update on email", email);
              res.send("plan added successfully");
            })
            .catch(() => {
              console.log("firebase plan update error for email", email);
              res.send("some error occured");
            });
        } else {
          res.send("account does not exist");
        }
      })
      .catch(() => {
        res.send("some error occured");
      });
  } else {
    res.status(403).send({ error: "not authorised" });
  }
});

app.post("/create-subscription", authenticateToken, async (req, res) => {
  // Simulate authenticated user. In practice this will be the
  // Stripe Customer ID related to the authenticated user.
  const customerId = req.body.customerId;

  // Create the subscription
  const priceId = req.body.priceId;

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    res.send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: { message: error.message } });
  }
});
const stripePrices = [3000, 5900, 4000, 9900];
app.get(
  "/create-checkout-session-updated/:id",
  authenticateToken,
  async (req, res) => {
    // let referral = `checkout-${uuidv4()}`;
    // if (req.query["referralId"] && req.query["referralId"] != "") {
    //   referral = req.query["referralId"];
    // }
    const email = req.user.email;
    const priceid = req.params["id"];
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceid,
            description: "Lazyapply LifeTime Plan",
            quantity: 1,
          },
        ],
        // client_reference_id: referral,
        mode: "payment",
        allow_promotion_codes: true,
        customer_email: email,
        success_url: `https://lazyapply.com/payment?info=success&email=${email}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: "https://lazyapply.com?payment?info=failure",
      });
      console.log("success", session);
      res.send(session);
    } catch (err) {
      console.log("error", err);
      res.send("Some error occured");
    }
  }
);

function trimString(str) {
  var stringStarted = false;
  var newString = "";

  for (var i in str) {
    if (!stringStarted && str[i] == "\n") {
      continue;
    } else if (!stringStarted) {
      stringStarted = true;
    }
    newString += str[i];
  }

  return newString;
}

const postProcessing = async (cover, date, name, title, id) => {
  cover = trimString(cover);
  const maxw = 996;
  const maxh = 1300;
  registerFont("./Ubuntu-Light.ttf", { family: "Ubuntu" });
  const canvas = createCanvas(maxw, maxh);
  const ctx = canvas.getContext("2d");
  // Set the font style and size
  // const fontUrl = "./Ubuntu-Light.ttf";
  // registerFont(fontUrl, { family: "Ubuntu" });
  ctx.font = '20px "Ubuntu"';
  // Draw the square boundary
  ctx.fillStyle = "black";
  // ctx.fillRect(20, 20, 600, 600);

  var rectXPos = 50;
  var rectYPos = 60;
  var rectWidth = maxw - 100;
  var rectHeight = maxh - 100;
  var rectXPos1 = 5;
  var rectYPos1 = 5;
  var rectWidth1 = maxw - 10;
  var rectHeight1 = maxh - 10;

  drawBorder(rectXPos, rectYPos, rectWidth, rectHeight);
  drawBorder1(rectXPos1, rectYPos1, rectWidth1, rectHeight1);
  drawBorder(rectXPos, rectYPos, rectWidth, rectHeight);
  drawBorderTop(rectXPos, rectYPos, rectWidth, rectHeight);

  ctx.fillStyle = "white";
  ctx.fillRect(rectXPos, rectYPos, rectWidth, rectHeight);

  function drawBorderTop(xPos, yPos, width, height, thickness = 5) {
    ctx.fillStyle = "black";
    ctx.fillRect(xPos - 2, yPos - thickness, width + 2 * 2, 5);
  }

  function drawBorder(xPos, yPos, width, height, thickness = 2) {
    ctx.fillStyle = "#b2cbf8";
    ctx.fillRect(
      xPos - thickness,
      yPos - thickness,
      width + thickness * 2,
      height + thickness * 2
    );
  }

  function drawBorder1(xPos, yPos, width, height, thickness = 0) {
    var gradient = ctx.createLinearGradient(0, 0, 700, 0); // createLinearGradient(x0, y0, x1, y1)
    gradient.addColorStop(0, "#E0EAFC");
    gradient.addColorStop(1, "#E0EAFC");

    ctx.fillStyle = gradient;
    // ctx.fillStyle='#007bff';
    ctx.fillRect(
      xPos - thickness,
      yPos - thickness,
      width + thickness * 2,
      height + thickness * 2
    );
  }

  function getLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  function getLinesForParagraphs(ctx, text, maxWidth) {
    return text
      .split("\n")
      .map((para) => getLines(ctx, para, maxWidth))
      .reduce((a, b) => a.concat(b));
  }

  const lines = getLinesForParagraphs(ctx, cover, maxw - 200);
  // Add dynamic text
  ctx.fillStyle = "black";
  console.log("lines", lines.length);
  lines.forEach((line, i) => {
    ctx.fillText(line, 100, 120 + 30 * i, maxw - 100);
  });
  ctx.fillStyle = "#007bff";
  ctx.fillText(date, 100, 120 + 30 * lines.length + 10, maxw - 100);

  ctx.fillStyle = "black";
  ctx.font = 'italic bold 14px "Ubuntu"';
  ctx.fillText("Lazyapply.com", maxw - 150, 1260, maxw - 100);
  ctx.strokeStyle = "#383838"; //set the color of the stroke line
  ctx.lineWidth = 1.5; //define the width of the stroke line
  ctx.font = "bold 30pt Ubuntu"; //set the font name and font size
  const nameTrimmed = name.toUpperCase().substring(0, 35);
  const metrics = ctx.measureText(nameTrimmed);
  if (name != "")
    ctx.strokeText(nameTrimmed, maxw - metrics.width - 50, 50, maxw - 100); //draw the text
  var buffer2 = canvas.toBuffer("image/png");
  // const response = await axios.post(
  //   "https://backend.lazyapply.com/presignedImageForCover",
  //   {
  //     buffer: buffer2,
  //     title: title,
  //   }
  // );
  // async function saveImage(output) {
  //   return await new Promise((resolve) => {
  //     const buffer = canvas.toBuffer("image/png");
  //     fs.writeFileSync(output, buffer);
  //     resolve();
  //   });
  // }
  const response = await saveImageToAws(buffer2, id);
  console.log("response", response);
  return response;
  // const saved = await saveImage(`./coverLetterExamples/${id}.png`);
  // console.log("saved", saved);
};

const postProcessingGenerator = async () => {
  const data = [
    {
      id: "coverLetterExample0",
      coverletter:
        "Dear [coverletterto],\n\nI am writing to apply for the [position] position at [nameofcompany]. My name is [myname], and I am a recent college graduate.\n\nI have no professional experience, but I am eager to learn and am confident I can bring value to your team. I have strong interpersonal, problem solving and communication skills, which I developed during my college career. I am also very familiar with a variety of software programs, which I am sure will be useful in this role.\n\nI am confident that I would make an excellent [roletype] and am excited by the opportunity to join [nameofcompany]. I am passionate about the work I do and believe I can make a positive contribution to your team. \n\nI look forward to hearing from you and thank you for your consideration.\n\nSincerely,\n[myname]\n",
      coverletterdata: {
        position: "Software Developer",
        nameofcompany: "ABC Company",
        coverletterto: "Hiring Manager",
        myname: "John Smith",
        experience: "none",
        skills:
          "interpersonal, problem solving, communication, software programs",
        roletype: "Software Developer",
      },
    },
    {
      id: "coverLetterExample1",
      coverletter:
        "Dear [coverletterto],\n\nI am writing to apply for the [position] internship at [nameofcompany] and I am confident that my skills and experience make me a great candidate for the role.\n\nMy name is [myname] and I am a student currently pursuing a degree in [experience]. I have a strong background in [skills], and I am confident that I can make a meaningful contribution to [nameofcompany] in this [roletype] internship.\n\nI possess the enthusiasm and drive needed to be successful in this role. My positive attitude and hardworking nature will be an asset to your company. I am a self-starter and have the ability to work independently as well as part of a team. I am always eager to learn and am willing to go above and beyond to get the job done.\n\nI am excited to learn more about this internship position and would be grateful for the opportunity to prove my worth. I am confident that I can make an immediate impact at [nameofcompany]. Thank you for your time and consideration.\n\nSincerely,\n[myname]",
      coverletterdata: {
        position: "Software Developer",
        nameofcompany: "ABC Technologies",
        coverletterto: "Hiring Manager",
        myname: "John Doe",
        experience: "Computer Science",
        skills: "programming and software development",
        roletype: "software development",
      },
    },
    {
      id: "coverLetterExample2",
      coverletter:
        "Dear [coverletterto],\n\nI am writing to apply for the [position] position at [nameofcompany]. My name is [myname], and I have four years of experience as a software developer.\n\nI am confident that my experience and skills make me an excellent fit for this role. My experience as a software developer has equipped me with the necessary skills to manage projects and ensure successful outcomes. I have worked on a wide range of projects, including web applications, desktop applications, mobile applications, and cloud applications. I have also developed and maintained databases, written code in multiple languages, and implemented testing protocols.\n\nIn addition to my technical expertise, I am highly organized and detail-oriented. I am able to work independently while also collaborating effectively with other team members. I am also able to troubleshoot problems quickly and efficiently.\n\nI am very excited about the opportunity to join [nameofcompany] and use my skills to help the team achieve success. I am confident that my experience and skills make me a great fit for the role.\n\nThank you for your time and consideration.\n\nSincerely,\n[myname]",
      coverletterdata: {
        position: "Software Developer",
        nameofcompany: "XYZ Company",
        coverletterto: "Hiring Manager",
        myname: "John Smith",
        experience: "4 years",
        skills:
          "Manage projects, Develop and maintain databases, Write code in multiple languages, Implement testing protocols, Highly organized and detail-oriented, Troubleshoot problems quickly and efficiently",
        roletype: "Software Developer",
      },
    },
    {
      id: "coverLetterExample3",
      coverletter:
        "Dear [coverletterto],\n\nI am writing to express my interest in the Manager position at [nameofcompany]. My name is [myname] and I am confident my experience and skills make me an excellent candidate for the role.\n\nI have [experience] of working in a managerial role which has provided me with a range of knowledge and experience that would be beneficial to your team. My expertise covers [skills], and I have experience in [roletype]. I am confident that I can hit the ground running and provide value to your team from day one.\n\nI am excited at the prospect of joining [nameofcompany] and I would welcome the chance to discuss the position in more detail. I have attached my resume for your review and I am available for an interview at any time that is convenient for you.\n\nThank you for your time and consideration.\n\nSincerely,\n[myname]",
      coverletterdata: {
        position: "Manager",
        nameofcompany: "ABC Company",
        coverletterto: "John Doe",
        myname: "Jane Doe",
        experience: "five years",
        skills: "team management, budgeting, and customer service",
        roletype: "leading a team of 20 staff",
      },
    },
  ];

  for (let index = 0; index < data.length; index++) {
    const d = data[index];
    await postProcessing(
      d.coverletter,
      "01-05-2023",
      d.coverletterdata.myname,
      d.coverletterdata.position,
      `coverLetterExample${index}`
    );
  }
};

app.get(
  "/create-checkout-session-subscription",
  authenticateToken,
  async (req, res) => {
    const planName = req.query["planName"]?.toUpperCase();
    const email = req.user.email;
    const priceid = process.env[`SUBSCRIPTION_ONETIME_PAYMENT_ID_${planName}`];
    try {
      const session = await stripe.checkout.sessions.create({
        billing_address_collection: "required",
        line_items: [
          {
            price: priceid,
            description: "Lazyapply split payment",
            quantity: 1,
          },
        ],
        phone_number_collection: {
          enabled: true,
        },
        mode: "subscription",
        allow_promotion_codes: false,
        customer_email: email,
        success_url: `https://lazyapply.com/split_payments?info=success&email=${email}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: "https://lazyapply.com/split_payments?info=failure",
      });
      console.log("success", session);
      res.send(session);
    } catch (err) {
      console.log("error", err);
      res.send("Some error occured");
    }
  }
);

app.get(
  "/create-checkout-session-targetedSearch",
  authenticateToken,
  async (req, res) => {
    const email = req.user.email;
    const priceid = process.env.TARGET_SEARCH_PRICE_ID;
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceid,
            description: "LazyApply-X Targeted Search",
            quantity: 1,
          },
        ],
        allow_promotion_codes: false,
        mode: "payment",
        customer_email: email,
        success_url: `https://lazyapply.com/targetsearch?info=success&email=${email}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://lazyapply.com/targetsearch?info=failure&email=${email}`,
      });
      console.log("success", session);
      res.send(session);
    } catch (err) {
      console.log("error", err);
      res.send("Some error occured");
    }
  }
);

app.get(
  "/create-checkout-session-lazyapplyx",
  authenticateToken,
  async (req, res) => {
    const email = req.user.email;
    const priceid = process.env.LAZYAPPLYX_PRICE_ID;
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceid,
            description: "LazyApply-X Targeted Search",
            quantity: 1,
          },
        ],
        metadata: {
          planName: "lazyapply-x",
        },
        allow_promotion_codes: false,
        mode: "payment",
        customer_email: email,
        success_url: `https://app.lazyapply.com/dashboard/lazyapply-x`,
        cancel_url: `https://app.lazyapply.com/dashboard/lazyapply-x`,
      });
      console.log("success", session);
      res.send(session);
    } catch (err) {
      console.log("error", err);
      res.send("Some error occured");
    }
  }
);

app.get(
  "/create-checkout-session-updated-test/:id",
  authenticateToken,
  async (req, res) => {
    const email = req.user.email;
    const priceid = req.params["id"];
    try {
      const session = await stripe1.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceid,
            description: "Lazyapply LifeTime Plan",
            quantity: 1,
          },
        ],
        mode: "payment",
        allow_promotion_codes: true,
        customer_email: email,
        success_url:
          "https://localhost:3000/payment?info=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://localhost:3000/payment?info=failure",
      });
      console.log("success", session);
      res.send(session);
    } catch (err) {
      console.log("error", err);
      res.send("Some error occured");
    }
  }
);

app.get("/order/success/:id", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.params["id"]);
  const customer = await stripe.customers.retrieve(session.customer);
  console.log(customer, session);
  res.send(session);
});

app.get("/order/success-test/:id", async (req, res) => {
  const session = await stripe1.checkout.sessions.retrieve(req.params["id"]);
  const customer = await stripe1.customers.retrieve(session.customer);
  console.log(customer, session);
  res.send(session);
});

const upgradePlanFrom = async (plan1, plan2, planDetails, email) => {
  if ("v2Id" in planDetails) {
    //type 1
    const mainRef = db.collection("users").doc(email);
    let finalPlanDetails = {};
    finalPlanDetails.planName = plan2;
    if (plan2 == "basic") {
      finalPlanDetails.dailyLimit = 150;
      finalPlanDetails.monthlyLimit = 4500;
      finalPlanDetails.resumeLimit = 1;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    }
    if (plan2 == "premium") {
      finalPlanDetails.dailyLimit = 750;
      finalPlanDetails.monthlyLimit = 22500;
      finalPlanDetails.resumeLimit = 5;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    } else if (plan2 == "unlimited") {
      finalPlanDetails.dailyLimit = 100000;
      finalPlanDetails.monthlyLimit = 300000;
      finalPlanDetails.resumeLimit = 10;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    }
    planDetails = {
      ...planDetails,
      ...finalPlanDetails,
    };
    console.log("planDetails", planDetails);
    return new Promise((resolve, reject) => {
      mainRef
        .set(
          {
            planDetails,
          },
          { merge: true }
        )
        .then((response) => {
          resolve(`successfully updated to ${plan2}, type1 v2id`);
        })
        .catch((err) => {
          reject("some error occured");
        });
    });
  } else {
    // type 2
    try {
      await planUpgradeV1(email);
    } catch {
      console.log("error");
    }
    const mainRef = db.collection("users").doc(email);
    const finalPlanDetails = {
      ...planDetails,
    };
    const idnew = email + "v2Id";
    if (plan2 == "basic") {
      finalPlanDetails.dailyLimit = 150;
      finalPlanDetails.monthlyLimit = 4500;
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.planName = plan2;
      finalPlanDetails.resumeLimit = 1;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    }
    if (plan2 == "premium") {
      finalPlanDetails.dailyLimit = 750;
      finalPlanDetails.monthlyLimit = 22500;
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.planName = plan2;
      finalPlanDetails.resumeLimit = 5;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    } else if (plan2 == "unlimited") {
      finalPlanDetails.dailyLimit = 100000;
      finalPlanDetails.monthlyLimit = 300000;
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.planName = plan2;
      finalPlanDetails.resumeLimit = 10;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    }
    return new Promise((resolve, reject) => {
      mainRef
        .set(
          {
            planDetails: finalPlanDetails,
          },
          { merge: true }
        )
        .then((response) => {
          resolve(`successfully updated to ${plan2}, type2 nov2id`);
        })
        .catch((err) => {
          reject("some error occured");
        });
    });
  }
};

const subscriptionPlanUpdate = async (planName, email) => {
  const mainRef = db.collection("users").doc(email);
  return new Promise((resolve, reject) => {
    mainRef
      .get()
      .then(async function (docRef) {
        if (docRef.exists) {
          const data = docRef.data();
          if (data.planDetails.planStarted === 1) {
            resolve("already started");
          } else {
            let startDate = new Date();
            let endDate = new Date().setDate(startDate.getDate() + 365);
            const finalPlanDetails = {
              endDate: new Date(endDate),
              startDate,
              planName,
              planStarted: 1,
            };
            const idnew = email + "v2Id";
            if (planName == "basic") {
              finalPlanDetails.dailyLimit = 150;
              finalPlanDetails.monthlyLimit = 4500;
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 1;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            }
            if (planName == "premium") {
              finalPlanDetails.dailyLimit = 750;
              finalPlanDetails.monthlyLimit = 22500;
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 5;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            } else if (planName == "unlimited") {
              finalPlanDetails.dailyLimit = 100000;
              finalPlanDetails.monthlyLimit = 300000;
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 10;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            }
            mainRef
              .set(
                {
                  planDetails: finalPlanDetails,
                },
                { merge: true }
              )
              .then((response) => {
                resolve("successfully updated");
              })
              .catch((err) => {
                reject("some error occured");
              });
          }
        } else {
          resolve(`No doc exist with email ${email}`);
        }
      })
      .catch((err) => {
        reject("some error occured");
      });
  });
};

const upgradePlan = (fromplan, toplan, email) => {
  const mainRef = db.collection("users").doc(email);
  return new Promise((resolve, reject) => {
    mainRef
      .get()
      .then(async function (docRef) {
        if (docRef.exists) {
          const data = docRef.data();
          if (data.planDetails.planStarted === 1) {
            console.log("plan already started");
            const response = await upgradePlanFrom(
              fromplan,
              toplan,
              data.planDetails,
              email
            );
            resolve(response);
          } else {
            console.log("No plan");
            await mainRef.set(
              {
                planDetails: {
                  ...data.planDetails,
                  planStarted: 1,
                },
              },
              { merge: true }
            );
            const response = await upgradePlanFrom(
              fromplan,
              toplan,
              {
                ...data.planDetails,
                planStarted: 1,
              },
              email
            );
            resolve(response);
          }
        } else {
          resolve(`No doc exist with email ${email}`);
        }
      })
      .catch((err) => {
        reject("some error occured");
      });
  });
};

app.get("/upgradePlan", async (req, res) => {
  const email = req.query["email"];
  const toplan = req.query["toplan"];
  const code = req.query["code"];
  if (code && code === process.env.UPGRADE_CODE) {
    const response = await upgradePlan("", toplan, email);
    res.send({ response: response });
  } else {
    res.send({ response: "wrong code" });
  }
});

// change Schedule
const changeSchedule = async (id) => {
  const schedule = await stripe.subscriptionSchedules.retrieve(id);
  console.log("schedule", schedule);
  const y = schedule.phases.map((x) => x.items);
  console.log(y);
  let specificDate = new Date("2023-07-20T14:40:00Z"); // ISO format: YYYY-MM-DDTHH:mm:ssZ
  let timestamp = Math.floor(specificDate.getTime() / 1000);
  console.log(timestamp);

  let specificDate1 = new Date("2023-08-20T14:45:00Z"); // ISO format: YYYY-MM-DDTHH:mm:ssZ
  let timestamp1 = Math.floor(specificDate1.getTime() / 1000);
  console.log(timestamp1);
  schedulefinal = await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "cancel",
    phases: [
      {
        end_date: timestamp,
        start_date: "1686003564",
        items: {
          0: {
            quantity: "1",
            plan: "price_1M43EoSBv8rKlDgOx3oFOXU1",
            billing_thresholds: "",
            price: "price_1M43EoSBv8rKlDgOx3oFOXU1",
          },
        },
      },
      {
        end_date: timestamp1,
        start_date: timestamp,
        items: {
          0: {
            quantity: "1",
            plan: "price_1M43EoSBv8rKlDgOx3oFOXU1",
            billing_thresholds: "",
            price: "price_1M43EoSBv8rKlDgOx3oFOXU1",
          },
        },
      },
      // {
      //   proration_behavior: "none",
      //   items: {
      //     0: {
      //       quantity: "1",
      //       price: "price_1M43EoSBv8rKlDgOx3oFOXU1",
      //     },
      //   },
      //   iterations: "1",
      // },
    ],
  });
  console.log("final", schedulefinal);
};

// changeSchedule("sub_sched_1NFlkSSBv8rKlDgOEMB7qd6n");

// async function billNow(customerId,subscriptionId) {
//     // 1. Create an invoice for the subscription
//     const invoice = await stripe.invoices.create({
//         subscription: subscriptionId,
//         customer: customerId,
//         auto_advance: true, // Auto-finalize this draft after ~1 hour
//     });

//     // 2. Pay the invoice
//     const paidInvoice = await stripe.invoices.pay(invoice.id);

//     console.log(paidInvoice);
// }

async function updateSubscriptionSchedule(subscriptionScheduleId) {
  const subscriptionSchedule = await stripe.subscriptionSchedules.update(
    subscriptionScheduleId,
    {
      end_behavior: "release",
      phases: [
        {
          start_date: "1686003564",
          end_date: "now",
          items: {
            0: {
              quantity: "1",
              plan: "price_1M43EoSBv8rKlDgOx3oFOXU1",
              billing_thresholds: "",
              price: "price_1M43EoSBv8rKlDgOx3oFOXU1",
            },
          },
        },
      ],
    }
  );

  console.log(subscriptionSchedule);
}

async function cancelSubscriptionAndInvoiceNow(subscriptionId, customerId) {
  // 1. Cancel the subscription
  const canceledSubscription = await stripe.subscriptions.del(
    subscriptionId,
    { invoice_now: true } // Create a final invoice before cancelling
  );

  // 2. Retrieve the subscription to get the latest_invoice
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const latestInvoiceId = subscription.latest_invoice;

  // 3. Pay the invoice if it's not already paid
  const invoice = await stripe.invoices.retrieve(latestInvoiceId);
  if (!invoice.paid) {
    const paidInvoice = await stripe.invoices.pay(invoice.id);
    console.log(paidInvoice);
  } else {
    console.log(invoice);
  }
}

async function createSubscription(customerId, planId) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        plan: planId,
      },
    ],
  });

  console.log(subscription);
}

// createSubscription('cus_O1pPFT65xM0JKe', 'price_1M43EoSBv8rKlDgOx3oFOXU1'); // Replace with your customer ID and plan ID

//cancelSubscriptionAndInvoiceNow('sub_1NFlkGSBv8rKlDgOrWo0bPvU', 'cus_O1pPFT65xM0JKe');

// updateSubscriptionSchedule('sub_sched_1NFlkSSBv8rKlDgOEMB7qd6n');

// billNow('cus_O1pPFT65xM0JKe'); // Replace 'sub_J6a6GmnFA5sV4Y' with your subscription ID

app.get("/create-checkout-session", authenticateToken, async (req, res) => {
  const email = req.user.email;

  try {
    console.log("stripe", stripe1);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1JedKPSBv8rKlDgO4xW4zUwp",
          description: "Lazyapply premium plan with lifetime access.",
          quantity: 1,
        },
      ],
      billing_address_collection: "required",
      mode: "payment",
      customer_email: email,
      success_url: "https://lazyapply.com/payment?info=success",
      cancel_url: "https://lazyapply.com/payment?info=failure",
    });
    console.log("success", session);
    res.send(session);
  } catch (err) {
    console.log("error", err);
    res.send("Some error occured");
  }
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const endpointSecretTest = process.env.STRIPE_WEBHOOK_SECRET_TEST;
app.post(
  "/webhooknew",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    console.log(endpointSecretTest);
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.header("Stripe-Signature"),
        endpointSecret
      );
    } catch (err) {
      console.log(err);
      console.log(`⚠️  Webhook signature verification failed.`);
      console.log(
        `⚠️  Check the env file and enter the correct webhook secret.`
      );
      return res.sendStatus(400);
    }

    // Extract the object from the event.
    const dataObject = event.data.object;
    console.log("data", dataObject);
    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
      case "checkout.session.completed":
        if (dataObject.payment_status == "paid") {
          let email = dataObject["customer_email"];
          let planName = "";
          let monthlyLimit;
          let dailyLimit;
          let p = parseInt(dataObject.amount_subtotal);
          if (email === null) {
            email = dataObject["customer_details"].email;
          }

          if (dataObject.mode === "subscription") {
            let mainId = "BASIC";
            if (p === 600 || p === 900 || p === 1500) {
              console.log("do nothing lazycv plans");
            } else if (p === 4900 || p === 6400 || p === 9900 || p === 12400) {
              console.log("dont create subscription");
              mixpanel.track("plan purchased v1", {
                distinct_id: email,
                type: "split",
                price: p / 100,
              });
            } else {
              if (p === 5000) {
                mainId = "BASIC";
                planName = "basic";
              } else if (p === 6500) {
                mainId = "PREMIUM";
                planName = "premium";
              } else if (p === 10000 || p === 12500) {
                mainId = "UNLIMITED";
                planName = "unlimited";
              }
              mixpanel.track("plan purchased v1", {
                distinct_id: email,
                type: "split",
                price: p / 100,
              });
              const checkoutSession = dataObject;
              let schedule = await stripe.subscriptionSchedules.create({
                from_subscription: checkoutSession.subscription,
              });
              const phases = schedule.phases.map((phase) => ({
                start_date: phase.start_date,
                end_date: phase.end_date,
                items: phase.items,
              }));
              schedule = await stripe.subscriptionSchedules.update(
                schedule.id,
                {
                  end_behavior: "cancel",
                  phases: [
                    ...phases,
                    {
                      items: [
                        {
                          price:
                            process.env[
                              `SUBSCRIPTION_RECURRING_PAYMENT_ID_${mainId}`
                            ],
                          quantity: 1,
                        },
                      ],
                      iterations: 1,
                      proration_behavior: "none",
                    },
                  ],
                }
              );
              const responsePlan = await subscriptionPlanUpdate(
                planName,
                email
              );
              addmailingfn(email, mailingjson.paidusers);
              console.log("responseplan", responsePlan);
            }
          } else if (
            "metadata" in dataObject &&
            "planName" in dataObject.metadata &&
            dataObject.metadata.planName === "lazyapply-x"
          ) {
            const mainRef = db.collection("targetSearchUsers").doc(email);
            mainRef
              .set({ planStarted: 1 }, { merge: true })
              .then(function () {
                res.send("successfully updated");
              })
              .catch((err) => {
                console.log("err", err);
                res.status(400).json({ error: "Something went wrong" });
              });
          } else {
            if (p >= 3000 && p <= 9900) {
              planName = "basic";
              monthlyLimit = 12000;
              dailyLimit = 150;
              mixpanel.people.set(email, {
                plan: "basic",
                price: p / 100,
              });
            } else if (p > 9900 && p <= 12900) {
              planName = "premium";
              monthlyLimit = 22500;
              dailyLimit = 750;
              mixpanel.people.set(email, {
                plan: "premium",
                price: p / 100,
              });
            } else if (p > 12900) {
              planName = "unlimited";
              monthlyLimit = 300000;
              dailyLimit = 100000;
              mixpanel.people.set(email, {
                plan: "unlimited",
                price: p / 100,
              });
            }
            mixpanel.track("plan purchased v1", {
              distinct_id: email,
              price: p / 100,
            });

            // await saleFpr(
            //   dataObject.id,
            //   email,
            //   Number(dataObject.amount_subtotal),
            //   planName
            // );
            addmailingfn(email, mailingjson.paidusers);
            const mainRef = db.collection("users").doc(email);
            let startDate = new Date();
            let endDate = new Date().setDate(startDate.getDate() + 365);
            console.log(
              new Date(endDate),
              startDate,
              planName,
              monthlyLimit,
              dailyLimit
            );
            const finalPlanDetails = {
              endDate: new Date(endDate),
              startDate,
              planName,
              monthlyLimit,
              dailyLimit,
              planStarted: 1,
            };
            const idnew = email + "v2Id";
            if (planName == "basic") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 1;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            } else if (planName == "premium") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 5;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            } else if (planName == "unlimited") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 10;
              finalPlanDetails.planType = "individual";
              finalPlanDetails.membertype = "admin";
            }
            if (planName == "gold") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 20;
              finalPlanDetails.planType = "enterprise";
              finalPlanDetails.membertype = "admin";
              finalPlanDetails.userLimit = 4;
            }
            if (planName == "platinum") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 100;
              finalPlanDetails.planType = "enterprise";
              finalPlanDetails.membertype = "admin";
              finalPlanDetails.userLimit = 15;
            }
            if (planName == "diamond") {
              finalPlanDetails.v2Id = idnew;
              finalPlanDetails.resumeLimit = 1000;
              finalPlanDetails.planType = "enterprise";
              finalPlanDetails.membertype = "admin";
              finalPlanDetails.userLimit = 1000;
            }

            mainRef
              .get()
              .then(function (docRef) {
                if (docRef.exists) {
                  const data = docRef.data();
                  if (data.planDetails.planStarted === 1) {
                    console.log("plan already started");
                    if (data.planDetails.planName == "basic") {
                      if (planName == "premium" || planName == "unlimited") {
                        upgradePlan("", planName, email)
                          .then((res) => {
                            console.log("res", res);
                          })
                          .catch((err) => {
                            console.log("err", err);
                          });
                      }
                    } else if (data.planDetails.planName === "premium") {
                      if (planName == "unlimited") {
                        upgradePlan("", planName, email)
                          .then((res) => {
                            console.log("res", res);
                          })
                          .catch((err) => {
                            console.log("err", err);
                          });
                      }
                    }
                  } else {
                    mainRef
                      .update({
                        planDetails: finalPlanDetails,
                      })
                      .then(() => {
                        console.log("success for plan update on email", email);
                      })
                      .catch((e) =>
                        console.log(
                          "firebase plan update error for email",
                          email
                        )
                      );
                  }
                } else {
                  console.log("no doc exist by this email");
                }
              })
              .catch((err) => {
                console.log("some error occured");
              });
          }
        }

        break;
      default:
      // Unexpected event type
    }
    res.sendStatus(200);
  }
);

async function saveFeedback(email, feedback) {
  const FieldValue = admin.firestore.FieldValue;
  feedback.createdAt = FieldValue.serverTimestamp();
  const mainRef = db.collection("feedbacks").doc(email);
  const id = uuidv4();
  try {
    const result = mainRef.set({ [id]: feedback }, { merge: true });
    return "success";
  } catch (err) {
    console.log(err, "err");
    return "error";
  }
}

app.post("/saveFeedback", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const feedback = req.body.feedback;

  try {
    const response = await saveFeedback(email, feedback);
    return res.send(response);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: { message: error.message } });
  }
});

async function saveFeedbackReferal(email, feedback) {
  const FieldValue = admin.firestore.FieldValue;
  feedback.createdAt = FieldValue.serverTimestamp();
  const mainRef = db.collection("users").doc(email);
  try {
    const result = mainRef.update({ feedbackReferal: feedback });
    return "success";
  } catch (err) {
    console.log(err, "err");
    return "error";
  }
}

async function saveFeedbackUpdated(email, feedback, id) {
  const FieldValue = admin.firestore.FieldValue;
  feedback.createdAt = FieldValue.serverTimestamp();
  const mainRef = db.collection("feedbacks").doc(email);
  try {
    const result = mainRef.set({ [id]: feedback }, { merge: true });
    return "success";
  } catch (err) {
    console.log(err, "err");
    return "error";
  }
}

app.post("/saveFeedbackUpdated", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const feedback = req.body.feedback;
  const id = req.body.id;

  try {
    const response = await saveFeedbackUpdated(email, feedback, id);
    return res.send(response);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: { message: error.message } });
  }
});

app.post("/saveFeedbackReferal", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const feedback = req.body.feedback;

  try {
    const response = await saveFeedbackReferal(email, feedback);
    return res.send(response);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: { message: error.message } });
  }
});

app.post("/addreferral", authenticateToken, (req, res) => {
  if (
    req.user.email === "vivekiitjcse@gmail.com" ||
    req.user.email === "prakhargupta.2106@gmail.com"
  ) {
    const mainRef = dbFree.collection("payments").doc("referralcodes");
    const code = req.body.code;
    const email = req.body.email;
    mainRef
      .get()
      .then((r) => {
        let codes = r.data().codes;
        const newCode = {
          mainprice: 2580,
          paymentlink: "https://pages.razorpay.com/pl_I3Lpx9SEuYM9pA/view",
          discountprice: 2322,
          referralcode: code,
        };
        const newCodes = {
          ...referralCodes,
          [code.toLowerCase()]: {
            email: email,
            referralCode: code.toLowerCase(),
          },
        };
        codes = [...codes, newCode];
        console.log(codes, newCodes);
        fs.writeFileSync("./referralCodes.json", JSON.stringify(newCodes));
        mainRef
          .set({ codes: codes }, { merge: true })
          .then(() => {
            res.send("success");
          })
          .catch((err) => {
            res.send("error");
          });
        console.log("done done");
      })
      .catch((error) => {
        console.log(error);
        res.send("error");
      });
  } else {
    res.status(403).send({ error: "not authorised" });
  }
});

async function saveReferral(email, code) {
  if (code.toLowerCase() in referralCodes) {
    const referralEmail = referralCodes[code.toLowerCase()].email;
    const mainRef = db.collection("referrals").doc(referralEmail);
    try {
      const r = mainRef.set({ [email]: 0 }, { merge: true });
      return r;
    } catch (err) {
      console.log(err, "err");
      return {};
    }
  } else {
    return {};
  }
}

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.header("Stripe-Signature"),
        endpointSecret
      );
    } catch (err) {
      console.log(err);
      console.log(`⚠️  Webhook signature verification failed.`);
      console.log(
        `⚠️  Check the env file and enter the correct webhook secret.`
      );
      return res.sendStatus(400);
    }

    // Extract the object from the event.
    const dataObject = event.data.object;
    console.log("data", dataObject);
    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
      case "invoice.payment_succeeded":
        if (dataObject["billing_reason"] == "subscription_create") {
          console.log("yooooooo----->");
          console.log(dataObject.lines.data);
          // The subscription automatically activates after successful payment
          // Set the payment method used to pay the first invoice
          // as the default payment method for that subscription
          const subscription_id = dataObject["subscription"];
          const payment_intent_id = dataObject["payment_intent"];

          // Retrieve the payment intent used to pay the subscription
          const payment_intent = await stripe.paymentIntents.retrieve(
            payment_intent_id
          );

          const subscription = await stripe.subscriptions.update(
            subscription_id,
            {
              default_payment_method: payment_intent.payment_method,
            }
          );
          console.log(dataObject.lines.data);
          const email = dataObject["customer_email"];
          const priceId = dataObject.lines.data[0].price.id;
          let planName = "";
          let monthlyLimit;
          let dailyLimit;
          if (priceId === "price_1JeJEjSBv8rKlDgObI14CBSm") {
            planName = "premium";
            monthlyLimit = 120000;
            dailyLimit = 150;
          } else if (priceId === "price_1JLtqESBv8rKlDgOSekCNfeB") {
            planName = "standard";
            monthlyLimit = 9000;
            dailyLimit = 150;
          } else {
            planName = "basic";
            monthlyLimit = 2400;
            dailyLimit = 150;
          }

          const mainRef = db.collection("users").doc(email);
          let startDate = new Date();
          let endDate = new Date().setDate(startDate.getDate() + 365);
          console.log(
            new Date(endDate),
            startDate,
            planName,
            monthlyLimit,
            dailyLimit
          );
          mainRef
            .update({
              planDetails: {
                endDate: new Date(endDate),
                startDate,
                planName,
                monthlyLimit,
                dailyLimit,
                planStarted: 1,
              },
            })
            .then(() => {
              console.log("success for plan update on email", email);
            })
            .catch((e) =>
              console.log("firebase plan update error for email", email)
            );

          console.log(
            "Default payment method set for subscription:" +
              payment_intent.payment_method
          );
        }

        break;
      case "invoice.payment_failed":
        // If the payment fails or the customer does not have a valid payment method,
        //  an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has
        // failed and to retrieve new card details.
        break;
      case "invoice.finalized":
        // If you want to manually send out invoices to your customers
        // or store them locally to reference to avoid hitting Stripe rate limits.
        break;
      case "customer.subscription.deleted":
        if (event.request != null) {
          // handle a subscription cancelled by your request
          // from above.
        } else {
          // handle subscription cancelled automatically based
          // upon your subscription settings.
        }
        break;
      case "customer.subscription.trial_will_end":
        // Send notification to your user that the trial will end
        break;
      default:
      // Unexpected event type
    }
    res.sendStatus(200);
  }
);

app.post("/updateresume", authenticateToken, (req, res) => {
  console.log(req.user);
  console.log(req.body.resume);
  console.log(req.body.skills);
  const resume = req.body.resume;
  const skills = req.body.skills;
  let obj = {};
  obj.resume = resume;
  obj.skills = skills;
  obj.resumevalidation = 1;
  const mainRef = db.collection("users").doc(req.user.email);
  mainRef
    .get()
    .then((docRef) => {
      if (docRef.exists) {
        const data = docRef.data();
        const resume = data.resume;
        mainRef
          .set({ ...data, ...obj, resume: { ...resume, ...obj.resume } })
          .then(() => {
            console.log("doc data--> after middleware");
            res.send("updated success");
          })
          .catch((err) => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" });
          });
      } else {
        mainRef
          .set(obj, { merge: true })
          .then((doc) => {
            console.log("doc data--> after middleware");
            res.send("updated success");
          })
          .catch((err) => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" });
          });
      }
    })
    .catch((err) => {
      res.status(400).json({ error: "Something went wrong" });
    });
});

const sendEmailResumeTracker = (textContent, senderEmail, subject, type) => {
  const params =
    type === 1
      ? {
          Destination: {
            ToAddresses: [senderEmail], // replace with recipient email address
          },
          Message: {
            Body: {
              Text: {
                Charset: "UTF-8",
                Data: textContent,
              },
            },
            Subject: {
              Charset: "UTF-8",
              Data: subject,
            },
          },
          Source: "info@lazyapply.com", // replace with your SES verified email address
        }
      : {
          Destination: {
            ToAddresses: [senderEmail], // replace with recipient email address
          },
          Message: {
            Body: {
              Html: {
                Charset: "UTF-8",
                Data: textContent,
              },
            },
            Subject: {
              Charset: "UTF-8",
              Data: subject,
            },
          },
          Source: "info@lazyapply.com", // replace with your SES verified email address
        };

  aws.config.update({
    region: "us-west-2",
    accessKeyId: "AKIAXUEEQ6FOS67VJ4ZV",
    secretAccessKey: "FlzkQBqWtCLWu5j7357T4O3jlC2FNQpYo8P7z31b",
  });
  // Creating SES service object
  var ses = new aws.SES();

  ses.sendEmail(params, (err, data) => {
    if (err) {
      console.error("err", err);
    } else {
      console.log("Email sent:", data);
    }
  });
};

// To add domain to verifyOrigin HEADER
app.post("/resumeTrackerTrack", verifyOriginHeader, async (req, res) => {
  const userId = req.body.userId;
  console.log("userId", userId);
  try {
    const getResumeTrackData = await db
      .collection("resumeTracker")
      .doc(userId)
      .get();
    if (getResumeTrackData.exists) {
      const viewcount = (getResumeTrackData.data()?.viewcount || 0) + 1;
      const codeverified = getResumeTrackData.data()?.codeverified || 0;
      const email = getResumeTrackData.data()?.email || "";
      try {
        await db
          .collection("resumeTracker")
          .doc(userId)
          .set({ viewcount: viewcount }, { merge: true });

        if (codeverified) {
          const textContent = `
          <html>
          <body>
          <p>Hello,</p>
          <p>Someone has just viewed your <a href="https://${userId}.rsme.io">resume</a>!</p>
          <p>Your resume has now been viewed a total of ${viewcount} times. Keep up the good work!</p>
          <p>Best,</p>
          <p>Team Lazyapply</p>
          </body>
          </html>
          `;

          sendEmailResumeTracker(
            textContent,
            email,
            "Someone viewed your resume",
            2
          );
        }
        console.log("viewcount updated");
        // lambda to send email with given data
        res.send({ message: "success" });
      } catch (err) {
        console.log("err", err);
        res.send({ message: "some error occured" });
      }
    } else {
      console.log("userId does not exist");
      res.send({ message: "userId does not exist" });
    }
  } catch (err) {
    console.log("err", err);
    res.send({ message: "some error occured" });
  }
});

app.post("/createResumeTrackerData", async (req, res) => {
  const email = req.body.email;
  const v2Id = email + "v2Id";
  const userId = req.body.userId;
  const codeverified = 0;
  const code = uuidv4();
  let found = false;
  const searchRequests = {
    q: "*",
    filter_by: `userId:=${userId}`,
  };
  try {
    const searchResponse = await clientTypesense
      .collections("resume-tracker")
      .documents()
      .search(searchRequests);
    found = searchResponse.found > 0;
  } catch (err) {
    console.log("some error occured in typesense", err);
  }

  if (found) {
    res.send({ message: "UserId already present" });
  } else {
    try {
      const createNewTracker = await db
        .collection("resumeTracker")
        .doc(userId)
        .set(
          {
            resumeId: `${userId}_resume`,
            email: email,
            userId: userId,
            resumeUploaded: 0,
            code: code,
            codeverified: codeverified,
          },
          { merge: true }
        );

      const addUserIds = await db
        .collection("v2collection")
        .doc("resumeIds")
        .collection(v2Id)
        .doc(userId)
        .set(
          {
            userId: true,
          },
          { merge: true }
        );

      res.send({ message: "successfully added" });
    } catch (err) {
      console.log("some error occured", err);
      res.send({ message: "some error occured" });
    }
  }
});

app.post("/verifyResumeTrackerCode", async (req, res) => {
  const codetobeverified = req.body?.code || "";
  const userId = req.body?.userId || "";
  if (codetobeverified != "" && userId != "") {
    try {
      const data = await db.collection("resumeTracker").doc(userId).get();
      const { code = "" } = data.data();
      console.log("code", code, codetobeverified);
      if (code != "" && code === codetobeverified) {
        try {
          await db.collection("resumeTracker").doc(userId).set(
            {
              codeverified: 1,
            },
            { merge: true }
          );
          res.send({ message: "success" });
        } catch (err) {
          console.log("err", err);
          res.send({ message: "some error occured" });
        }
      } else {
        console.log("invalid code");
        res.send({ message: "some error occured" });
      }
    } catch (err) {
      console.log("err", err);
      res.send({ message: "some error occured" });
    }
  } else {
    res.send({ message: "some error occured" });
  }
});

app.post("/addsubdomain", async (req, res) => {
  try {
    const userId = req.body.userId;
    const senderEmail = req.body.senderEmail;
    const data = await axios.post(
      `https://api.vercel.com/v10/projects/${process.env.VERCELPROJECTNAME}/domains`,
      {
        name: `${userId}.${process.env.RESUMETRACKERMAINDOMAIN}`,
      },
      {
        headers: { Authorization: `Bearer ${process.env.VERCELTOKEN}` },
      }
    );
    console.log("data", data);
    const maindata = await db.collection("resumeTracker").doc(userId).get();
    const code = maindata.data().code;
    const verificationLink = `https://${userId}.rsme.io/verifyEmail?code=${code}`;
    sendEmailResumeTracker(
      `Please verify your email to enable tracking of views on your resume. Click on the following link to verify your email: ${verificationLink}. Your resume is available on https://${userId}.rsme.io`,
      senderEmail,
      "Resume Tracker Verification Email",
      1
    );
    res.send({ message: "success" });
  } catch (err) {
    console.log("err occured in adding subdomain", err, err?.response?.data);
    res.send({ message: "Some error occured" });
  }
});

app.post("/updateresumenew", authenticateToken, (req, res) => {
  console.log(req.body.resume);
  const resume = req.body.resume;
  const {
    expectedsalary,
    website_blog_portfolio,
    message_to_the_hiring_manager,
    what_makes_you_unique,
    valid_driver_license,
    earliest_start_date,
    race_ethnicity,
    disability,
    veteran,
    address,
    coverletter,
    noticeperiod,
  } = resume;
  let obj = {};
  obj.resume = {
    race_ethnicity,
    disability,
    veteran,
    address,
    noticeperiod,
    coverletter,
    language: [{ name: "english", proficiency: "intermediate" }],
    additionalInfo: {
      expectedsalary,
      website_blog_portfolio,
      message_to_the_hiring_manager,
      what_makes_you_unique,
      valid_driver_license,
      earliest_start_date,
    },
  };
  if ("visa_status" in resume) {
    obj.resume = { ...obj.resume, visa_status: resume.visa_status };
  }
  if ("phone_country_code" in resume) {
    obj.resume = {
      ...obj.resume,
      phone_country_code: resume.phone_country_code,
    };
  }
  if ("languages_you_know" in resume) {
    obj.resume = {
      ...obj.resume,
      languages_you_know: resume.languages_you_know,
    };
  }
  if ("linkedin_profile_url" in resume) {
    obj.resume = {
      ...obj.resume,
      linkedin_profile_url: resume.linkedin_profile_url,
    };
  }
  obj.additionalresumevalidation = 1;
  console.log(obj, "mainobj");
  const mainRef = db.collection("users").doc(req.user.email);
  mainRef
    .get()
    .then((docRef) => {
      if (docRef.exists) {
        const data = docRef.data();
        const resume = data.resume;
        mainRef
          .set({ ...data, ...obj, resume: { ...resume, ...obj.resume } })
          .then(() => {
            console.log("doc data--> after middleware");
            res.send("updated success");
          })
          .catch((err) => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" });
          });
      } else {
        mainRef
          .set(obj, { merge: true })
          .then(() => {
            console.log("doc data--> after middleware");
            res.send("updated success");
          })
          .catch((err) => {
            console.log(err);
            res.status(400).json({ error: "Something went wrong" });
          });
      }
    })
    .catch((err) => {
      res.status(400).json({ error: "Something went wrong" });
    });
});

// iygCeZ2wAbD1Tcs5l3DS -- feedback
//admin.database.ServerValue.TIMESTAMP  -- timestamp
app.post("/sendfeedback", authenticateToken, (req, res) => {
  console.log(req.user);
  let feedback = JSON.parse(req.body.feedback);
  const FieldValue = admin.firestore.FieldValue;
  feedback.timestamp = FieldValue.serverTimestamp();
  feedback.mainaccountname = req.user.name;
  feedback.mainaccountemail = req.user.email;
  console.log(feedback);
  const mainRef = db.collection("feedback").doc(req.user.email);
  mainRef
    .get()
    .then(function (docRef) {
      if (docRef.exists) {
        mainRef
          .update(feedback)
          .then(() => {
            res.send("success");
          })
          .catch((err) => {
            res.status(400).json({ error: "Something went wrong" });
          });
      } else {
        mainRef
          .set(feedback)
          .then(() => {
            res.send("success");
          })
          .catch((err) => {
            res.status(400).json({ error: "Something went wrong" });
          });
      }
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
      res.status(400).json({ error: "Something went wrong" });
    });
});

app.post("/sendvoting", authenticateToken, (req, res) => {
  const platformName = req.body.platformName;
  const mainRef = db.collection("voting").doc("allvotes");
  const userRef = db.collection("users").doc(req.user.email);
  mainRef
    .get()
    .then(function (docRef) {
      if (docRef.exists && docRef.data()[platformName]) {
        console.log(docRef.data(), platformName);
        const newValueOfPlatform = docRef.data()[platformName] + 1;
        mainRef
          .set(
            { ...docRef.data(), [platformName]: newValueOfPlatform },
            { merge: true }
          )
          .then(() => {
            userRef
              .set({ voted: platformName }, { merge: true })
              .then(() => {
                res.send("success");
              })
              .catch((err) => {
                res.send("error");
              });
          })
          .catch((err) => {
            res.send("error");
          });
      } else {
        mainRef
          .set(
            {
              [platformName]: 1,
            },
            { merge: true }
          )
          .then(() => {
            userRef
              .set({ voted: platformName }, { merge: true })
              .then(() => {
                res.send("success");
              })
              .catch((err) => {
                res.send("error");
              });
          })
          .catch((err) => {
            res.send("error");
          });
      }
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
      res.send("error");
    });
});

app.get("/sendvoting", authenticateToken, (req, res) => {
  const mainRef = db.collection("voting").doc("allvotes");
  mainRef
    .get()
    .then(function (docRef) {
      if (docRef.exists) {
        res.send(docRef.data());
      } else {
        res.send({});
      }
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
      res.send("error");
    });
});

app.post("/finishplannew", authenticateToken, (req, res) => {
  if (
    req.user.email === "vivekiitjcse@gmail.com" ||
    req.user.email === "prakhargupta.2106@gmail.com"
  ) {
    const email = req.body.email;
    const mainRef = db.collection("users").doc(email);
    mainRef.get().then(function (docRef) {
      console.log(docRef.data());
      let planDetails = docRef.data().planDetails;
      planDetails.planStarted = 0;
      mainRef
        .set({ planDetails }, { merge: true })
        .then(() => {
          res.send("success");
        })
        .catch((err) => {
          res.send("error");
        });
    });
  }
});

app.get("/getUserSessions", authenticateToken, (req, res) => {
  console.log(req.user);
  const mainRef = db
    .collection("users")
    .doc(req.user.email)
    .collection("session");
  // const mainRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");

  let startdate = new Date();
  startdate.setHours(0, 0, 0, 0);
  let enddate = new Date();
  enddate.setHours(23, 59, 59, 999);
  console.log(startdate, enddate);
  let value = [];
  let sessiontoday = [];
  let length = 0;
  let totalsessions = 0;
  let totalsessionstoday = 0;
  mainRef
    .get()
    .then(async function (docRef) {
      // console.log(docRef.size);
      if (docRef.size > 0) {
        let mainRef1 = mainRef
          .where("createdAt", ">=", startdate)
          .where("createdAt", "<=", enddate)
          .orderBy("createdAt");

        try {
          let data = await mainRef1.get();
          totalsessionstoday = data.size;
          data.forEach((d) => {
            // console.log("todays", d.data());
            sessiontoday.push(d.data());
            // console.log(sessiontoday);
          });
          console.log("end");
        } catch (err) {
          console.log("Error getting documents", err);
        }

        docRef.forEach((data) => {
          // console.log("r", data.data());
          if (data.data() && "count" in data.data()) {
            length += data.data().count;
          }
          value.push(data.data());
        });

        totalsessions = docRef.size;
        res.send({
          sessiontoday: sessiontoday,
          value: value,
          totalsessions,
          length,
          totalsessionstoday,
        });
      } else {
        res.send({
          sessiontoday: sessiontoday,
          value: value,
          totalsessions,
          length,
          totalsessionstoday,
        });
      }
      console.log("Document written with ID: ", docRef.id);
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
      res.status(400).json({ error: "Something went wrong" });
    });
});

app.post(
  "/coverLetterGeneratedCouponCode",
  authenticateToken,
  async (req, res) => {
    const code = req.body.code;
    let codeexist = 0;
    for (let index = 0; index < coverLetterCodes.length; index++) {
      const c = coverLetterCodes[index];
      console.log(c.coupanCode);
      if (c.coupanCode.toUpperCase() == code) {
        codeexist = 1;
        console.log("code exist");
        break;
      }
    }
    if (codeexist === 1) {
      try {
        await db
          .collection("users")
          .doc(req.user.email)
          .set({ coverLetterPlanActiveStatus: true }, { merge: true });
        res.send("Plan updated successfully");
      } catch (err) {
        res.send("Some error occured while updating");
      }
    } else {
      res.send("Coupan code doesn't exist");
    }
  }
);

app.post("/updateWithCoupanCode", authenticateToken, (req, res) => {
  const code = req.body.code;
  let codeexist = 0;
  for (let index = 0; index < coupanCodes.length; index++) {
    const c = coupanCodes[index];
    console.log(c.coupanCode);
    if (c.coupanCode.toUpperCase() == code) {
      codeexist = 1;
      console.log("code exist");
      break;
    }
  }
  if (codeexist === 1) {
    const mainRef = db.collection("users").doc(req.user.email);
    const v2Id = req.user.email + "v2Id";
    let obj = {
      planName: "basic",
      monthlyLimit: 12000,
      dailyLimit: 150,
      planStarted: 1,
      resumeLimit: 1,
      planType: "individual",
      membertype: "admin",
      v2Id: v2Id,
    };
    mixpanel.people.set(req.user.email, {
      plan: "basic",
      price: 67,
    });
    mixpanel.track("plan purchased v1", {
      distinct_id: req.user.email,
      price: 67,
    });
    addmailingfn(req.user.email, mailingjson.paidusers);
    mainRef
      .set({ coupanCode: code, planDetails: obj }, { merge: true })
      .then(() => {
        console.log("successfully updated the plan");
        res.send("Plan updated successfully");
      })
      .catch((err) => {
        console.log("error", err);
        res.send("Some error occured while updating");
      });
  } else {
    res.send("Coupan code doesn't exist");
  }
});

app.get("/getUserDetails", authenticateToken, (req, res) => {
  console.log(req.user);
  const mainRef = db.collection("users").doc(req.user.email);
  // const mainRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");
  mainRef
    .get()
    .then(function (docRef) {
      console.log(docRef.data());
      res.send(docRef.data());
      console.log("Document written with ID: ", docRef.id);
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
      res.status(400).json({ error: "Something went wrong" });
    });
});

app.get("/getUserDetailsRestart/:email", authenticateToken, (req, res) => {
  const email = req.params["email"];
  const mainRef = db.collection("users").doc(email);
  const whichEmail = req.user.email;
  if (whichEmail === "hardikrawat5061995@gmail.com") {
    mainRef
      .get()
      .then(function (docRef) {
        console.log(docRef.data());
        res.send(docRef.data());
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
        res.status(400).json({ error: "Something went wrong" });
      });
  } else {
    res.status(400).json({ error: "Something went wrong" });
  }
});

app.post("/updatePhone", authenticateToken, (req, res) => {
  console.log(req.body.phoneNumber);
  console.log(req.body.country);
  let obj = {
    phoneNumber: req.body.phoneNumber,
    phoneNumberValidation: 1,
    country: req.body.country,
  };

  const mainRef = db.collection("users").doc(req.user.email);
  mainRef
    .update(obj)
    .then(async () => {
      const id = await findContactId(req.user.email);
      if (id) {
        await updateContact(id, req.body.phoneNumber);
      }
      console.log("phone number updated");
      res.send("Updated phone number success");
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({ error: "Something went wrong" });
    });
});

app.post("/updatePlan", authenticateToken, (req, res) => {
  let numberOfDays = parseInt(req.body.numberOfDays) + 1;
  let numberOfCredits = parseInt(req.body.numberOfCredits);
  let email = req.body.email;
  console.log(numberOfDays, numberOfCredits);
  if (
    req.user.email === "vivekiitjcse@gmail.com" ||
    req.user.email === "prakhargupta.2106@gmail.com"
  ) {
    const mainRef = db.collection("users").doc(email);
    mainRef
      .get()
      .then(function (docRef) {
        if (docRef.exists) {
          const planDetails = docRef.data().planDetails;
          let monthlyLimit = planDetails.monthlyLimit + numberOfCredits;
          let endDate = planDetails?.endDate || "";
          let planStarted = 1;
          let dailyLimit = planDetails?.dailyLimit || 80;
          let startDate = planDetails?.startDate || "";
          let planName = planDetails?.planName || "free";

          if (endDate == "") {
            console.log("Enddate is empty");
            endDate = new Date();
          } else {
            endDate = endDate.toDate();
          }
          if (startDate == "") {
            startDate = new Date();
          }

          console.log("Enddate is", endDate, endDate.getDate());
          endDate = endDate.setDate(new Date(endDate.getDate() + numberOfDays));

          console.log(monthlyLimit, new Date(endDate));

          mainRef
            .update({
              planDetails: {
                planStarted: planStarted,
                endDate: new Date(endDate),
                monthlyLimit: monthlyLimit,
                startDate: startDate,
                dailyLimit: dailyLimit,
                planName: planName,
              },
            })
            .then(() => {
              console.log("updated successfully");
              res.send("updated successfully");
            })
            .catch((e) => {
              console.log("error", e);
              res.send("Something went wrong");
            });
        } else {
          res.send("No account exist with this email");
        }
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
        res.status(400).json({ error: "Something went wrong" });
      });
  } else {
    res.status(403).send({ error: "not authorised" });
  }
});

app.post("/savejoblinksindeedUpdated", authenticateToken, (req, res) => {
  const docRef = db.collection("users").doc(req.user.email);
  // const docRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");
  // const totalLinks = req.body.totalLinks;
  // docRef
  //   .get()
  //   .then((doc) => {
  //     if (doc.exists) {
  //       console.log(doc.data());
  //       let jobLinks = [];
  //       if ("indeedJobApplicationLinks" in doc.data())
  //         jobLinks = doc.data().indeedJobApplicationLinks;

  //       const map = new Map();
  //       const array2 = jobLinks;
  //       const array1 = totalLinks;
  //       array1.forEach((item) => map.set(item.href, item));
  //       array2.forEach((item) => {
  //         if (typeof item === "object" && item != null) {
  //           map.set(item.href, { ...map.get(item.href), ...item });
  //         } else {
  //           if (map.get(item)) {
  //             map.set(item, { ...map.get(item), href: item });
  //           } else {
  //             map.set(item, item);
  //           }
  //         }
  //       });
  //       const mergedArr = Array.from(map.values());
  //       const combinedJobLinks = mergedArr;

  //       //const combinedJobLinks = [...totalLinks, ...jobLinks];
  //       console.log(
  //         // [...new Set(combinedJobLinks)].length,
  //         jobLinks.length,
  //         totalLinks.length
  //       );
  //       console.log(combinedJobLinks);
  //       console.log("doc exist, update the links in firestore");
  //       docRef
  //         .update({
  //           indeedJobApplicationLinks: combinedJobLinks,
  //         })
  //         .then(() => {
  //           console.log("Document successfully written!");
  //           res.send({ totalLinks: combinedJobLinks });
  //         })
  //         .catch((error) => {
  //           console.error("Error writing document: ", error);
  //           res.status(400).json({ error: "Something went wrong" });
  //         });
  //     } else {
  //       // doc.data() will be undefined in this case
  //       console.log("No such document!");
  //       res.send("no data");
  //     }
  //   })
  //   .catch((error) => {
  //     res.status(400).json({ error: "Something went wrong" });
  //     console.log("Error getting document:", error);
  //   });
  res.send({ totalLinks: [] });
});

app.post("/savejoblinksindeed", authenticateToken, (req, res) => {
  // const docRef = db.collection("users").doc(req.user.email);
  // // const docRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");
  // const totalLinks = req.body.totalLinks;
  // docRef
  //   .get()
  //   .then((doc) => {
  //     if (doc.exists) {
  //       console.log(doc.data());
  //       let jobLinks = [];
  //       if ("indeedJobApplicationLinks" in doc.data())
  //         jobLinks = doc.data().indeedJobApplicationLinks;
  //       const combinedJobLinks = [...totalLinks, ...jobLinks];
  //       console.log(
  //         [...new Set(combinedJobLinks)].length,
  //         jobLinks.length,
  //         totalLinks.length
  //       );
  //       console.log(combinedJobLinks);
  //       console.log("doc exist, update the links in firestore");
  //       docRef
  //         .update({
  //           indeedJobApplicationLinks: [...new Set(combinedJobLinks)],
  //         })
  //         .then(() => {
  //           console.log("Document successfully written!");
  //           res.send({ totalLinks: [...new Set(combinedJobLinks)] });
  //         })
  //         .catch((error) => {
  //           console.error("Error writing document: ", error);
  //           res.status(400).json({ error: "Something went wrong" });
  //         });
  //     } else {
  //       // doc.data() will be undefined in this case
  //       console.log("No such document!");
  //       res.send("no data");
  //     }
  //   })
  //   .catch((error) => {
  //     res.status(400).json({ error: "Something went wrong" });
  //     console.log("Error getting document:", error);
  //   });
  res.send({ totalLinks: [] });
});

const jobsAppliedData = (variable, jobsappliedlength, name) => {
  variable[name] = jobsappliedlength;
  variable.totalJobLinks =
    variable.linkedinJobApplicationLinksFinal +
    variable.indeedJobApplicationLinksFinal +
    variable.ziprecruiterJobApplicationLinksFinal;
  return variable;
};

const initJobsAppliedData = (jobsapplied) => {
  let variable = {
    linkedinJobApplicationLinksFinal: 0,
    indeedJobApplicationLinksFinal: 0,
    ziprecruiterJobApplicationLinksFinal: 0,
  };
  if ("linkedinJobApplicationLinksFinal" in jobsapplied) {
    variable.linkedinJobApplicationLinksFinal =
      jobsapplied.linkedinJobApplicationLinksFinal.length;
  }
  if ("indeedJobApplicationLinksFinal" in jobsapplied) {
    variable.indeedJobApplicationLinksFinal =
      jobsapplied.indeedJobApplicationLinksFinal.length;
  }
  if ("ziprecruiterJobApplicationLinksFinal" in jobsapplied) {
    variable.ziprecruiterJobApplicationLinksFinal =
      jobsapplied.ziprecruiterJobApplicationLinksFinal.length;
  }
  variable.totalJobLinks =
    variable.linkedinJobApplicationLinksFinal +
    variable.indeedJobApplicationLinksFinal +
    variable.ziprecruiterJobApplicationLinksFinal;

  return variable;
};

//Saves the current session
app.post("/savesessionUpdated1", authenticateToken, (req, res) => {
  const email = req.user.email;
  let sessionObj = req.body.session;
  let sessionLinks = req.body.sessionLinks;
  sessionObj.sessionLinks = sessionLinks;
  console.log(sessionLinks);
  let name = "";
  if (sessionObj.platformName == "indeed") {
    name = "indeedJobApplicationLinksFinal";
  } else {
    name = "linkedinJobApplicationLinksFinal";
  }
  mixpanel.track("jobs applied", {
    distinct_id: email,
    totaljobs: sessionObj.count,
    platformName: sessionObj.platformName,
  });
  sessionObj.createdAt = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("users").doc(email).collection("session");
  const mainRef = db.collection("users").doc(email);
  mainRef
    .get()
    .then((resp) => {
      console.log(resp);
      // let variable = initJobsAppliedData(resp.data());
      // console.log("variable", variable);
      if (name in resp.data()) {
        //update
        // let a = resp.data()[name];
        // if (name === "linkedinJobApplicationLinksFinal") {
        //   const map = new Map();
        //   const array2 = a;
        //   const array1 = sessionLinks;
        //   array1.forEach((item) => map.set(item.href, item));
        //   array2.forEach((item) => {
        //     if (typeof item === "object" && item != null) {
        //       map.set(item.href, { ...map.get(item.href), ...item });
        //     } else {
        //       if (map.get(item)) {
        //         map.set(item, { ...map.get(item), href: item });
        //       } else {
        //         map.set(item, item);
        //       }
        //     }
        //   });
        //   const mergedArr = Array.from(map.values());
        //   a = mergedArr;
        // } else {
        //   const map = new Map();
        //   const array2 = a;
        //   const array1 = sessionLinks;
        //   array1.forEach((item) => map.set(item.href, item));
        //   array2.forEach((item) => {
        //     if (typeof item === "object" && item != null) {
        //       map.set(item.href, { ...map.get(item.href), ...item });
        //     } else {
        //       if (map.get(item)) {
        //         map.set(item, { ...map.get(item), href: item });
        //       } else {
        //         map.set(item, item);
        //       }
        //     }
        //   });
        //   const mergedArr = Array.from(map.values());
        //   a = mergedArr;
        // }
        // variable = jobsAppliedData(variable, a.length, name);
        sessionObj.sessionLinks = sessionObj.sessionLinks;

        docRef
          .add(sessionObj)
          .then(() => {
            console.log("save session -----> success");
            res.send("success updated");
            // mainRef
            //   .update({
            //     [name]: a,
            //   })
            //   .then((resp) => {
            //     console.log(resp);
            //     addmailingfn(email, mailingjson.jobsapplied, variable);
            //     res.send("success updated");
            //   })
            //   .catch((err) => {
            //     console.log("error");
            //     res.send("error");
            //   });
          })
          .catch((error) => {
            console.log(error);
            res.send("error");
          });
      } else {
        //set
        docRef
          .add(sessionObj)
          .then(() => {
            console.log("save session -----> success");
            res.send("success updated");
            // mainRef
            //   .set({ [name]: sessionLinks }, { merge: true })
            //   .then((resp) => {
            //     console.log(resp);
            //     addmailingfn(email, mailingjson.jobsapplied, variable);
            //     res.send("success updated");
            //   })
            //   .catch((err) => {
            //     console.log("error");
            //     res.send("error");
            //   });
          })
          .catch((error) => {
            console.log(error);
            res.send("error");
          });
      }
    })
    .catch((err) => {
      res.send("error");
      console.log(err);
    });
});

const recursiveCall = async (sessionObj, email, samesessionuid) => {
  const links = sessionObj.sessionLinks;
  const linksbefore = sessionObj.sessionLinksBefore;
  const docRef = db.collection("users").doc(email).collection("session");
  if (links.length <= 600) {
    let yourArray = links;
    let halfwayThrough = Math.floor(yourArray.length / 2);
    let arrayFirstHalf = yourArray.slice(0, halfwayThrough);
    let arraySecondHalf = yourArray.slice(halfwayThrough, yourArray.length);
    let firstsessionobj = {
      ...sessionObj,
      samesessionuid,
      count: arrayFirstHalf.length,
      sessionLinks: arrayFirstHalf,
      sessionLinksBefore: linksbefore,
    };
    let secondsessionobj = {
      ...sessionObj,
      count: arraySecondHalf.length,
      samesessionuid,
      sessionLinks: arraySecondHalf,
      sessionLinksBefore: [],
    };
    await docRef.add(firstsessionobj);
    await docRef.add(secondsessionobj);
  } else if (links.length <= 2000) {
    console.log("greater than 600");
    let yourArray = links;
    let halfwayThrough = Math.floor(yourArray.length / 3);
    let arrayFirstHalf = yourArray.slice(0, halfwayThrough);
    let arraySecondHalf = yourArray.slice(halfwayThrough, 2 * halfwayThrough);
    let arrayThirdHalf = yourArray.slice(2 * halfwayThrough, yourArray.length);
    let firstsessionobj = {
      ...sessionObj,
      count: arrayFirstHalf.length,
      samesessionuid,
      sessionLinks: arrayFirstHalf,
      sessionLinksBefore: linksbefore,
    };
    let secondsessionobj = {
      ...sessionObj,
      count: arraySecondHalf.length,
      samesessionuid,
      sessionLinks: arraySecondHalf,
      sessionLinksBefore: [],
    };
    let thirdsessionobj = {
      ...sessionObj,
      count: arrayThirdHalf.length,
      samesessionuid,
      sessionLinks: arrayThirdHalf,
      sessionLinksBefore: [],
    };
    await docRef.add(firstsessionobj);
    await docRef.add(secondsessionobj);
    await docRef.add(thirdsessionobj);
  }
  return "sucess";
};

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI,
});

// const findHeading = (positionToSearch) => {
//   const keys = Object.keys(finalans);
//   let result = "";
//   for (let index = 0; index < keys.length; index++) {
//     const heading = keys[index];
//     const subheadings = finalans[heading];
//     const positions = Object.keys(subheadings);
//     for (let index = 0; index < positions.length; index++) {
//       const position = positions[index];
//       if (position === positionToSearch) {
//         result = heading;
//         break;
//       }
//     }
//     if (result != "") {
//       break;
//     }
//   }
//   return result;
// };
// app.get("/setheadings", async (req, res) => {
//   for (let index = 0; index < allcover.length; index++) {
//     const element = allcover[index];
//     const id = element.id;
//     const position = element.coverletterdata.position.trim().toLowerCase();
//     const result = findHeading(position);
//     if (result === "") {
//       console.log("result not found");
//     } else {
//       // await db
//       //   .collection("coverletters")
//       //   .doc(id)
//       //   .set({ headingName: result }, { merge: true });
//       console.log("success");
//     }
//   }
//   res.send("finalcompleted");
// });

// doc.ref.delete();
// var FieldValue = require("firebase-admin").firestore.FieldValue;
//  capital: FieldValue.delete()
const postProcessAfterCover = async (id, coverdata, date, coverletter) => {
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  let heading = await getheading(coverdata.position);
  heading = trimString(heading).trim().toLowerCase();
  if (heading != "" && !heading.includes("0")) {
    console.log(heading);
    const resultImageSaved = await postProcessing(
      coverletter,
      date,
      coverdata.myname,
      coverdata.position,
      id
    );
    if (resultImageSaved === "success") {
      //image saved
      const searchRequests = [
        {
          q: "*",
          per_page: 250,
        },
        {
          q: "*",
          filter_by: `headingName:=${heading}`,
          per_page: 250,
        },
        {
          q: "*",
          filter_by: `companyName:=${coverdata.nameofcompany
            .trim()
            .toLowerCase()}`,
          per_page: 250,
        },
      ];
      try {
        const data = await clientTypesense
          .collections("cover-letter-mainheadings")
          .documents()
          .search(searchRequests[0]);
        const data1 = await clientTypesense
          .collections("cover-letter-mainheadings")
          .documents()
          .search(searchRequests[1]);
        const data2 = await clientTypesense
          .collections("cover-letter-companies")
          .documents()
          .search(searchRequests[2]);
        let indexPresent = -1;
        let dataresult = {};
        if (data.found > 0) {
          for (let index = 0; index < data.hits.length; index++) {
            const element = data.hits[index];

            const subheadings = element.document.subHeadings;
            for (let index = 0; index < subheadings.length; index++) {
              const subheading = subheadings[index];
              if (subheading == coverdata.position.trim().toLowerCase()) {
                indexPresent = index;
                dataresult = element;
                break;
              }
            }
            if (indexPresent >= 0) {
              break;
            }
          }

          if (indexPresent >= 0) {
            console.log(dataresult);
            const headingPresent = dataresult.document.headingName;
            console.log("headingPresent", headingPresent);
            if (!(data2.found > 0)) {
              const randomindex = getRandomInt(0, 3);
              await db.collection("covercompanies").add({
                companyName: coverdata.nameofcompany.trim().toLowerCase(),
                faq: faqcompanies[randomindex],
              });
            }
            await db.collection("coverletters").doc(id).set(
              {
                headingName: headingPresent,
                imageGenerated: 1,
              },
              { merge: true }
            );
          } else {
            console.log("headingNew", heading, data1.hits);
            if (data1.found > 0) {
              let subheadings = data1.hits[0].document.subHeadings;
              subheadings.push(coverdata.position.trim().toLowerCase());
              subheadings = [...new Set(subheadings)];
              console.log(
                "subheading present",
                subheadings,
                data1.hits[0].document.id
              );
              await db
                .collection("coverheadingcatagories")
                .doc(data1.hits[0].document.id)
                .set(
                  {
                    subHeadings: subheadings,
                  },
                  { merge: true }
                );
              const randomindexTitle = getRandomInt(0, 3);
              await db.collection("covertitles").add({
                jobtitle: coverdata.position.trim().toLowerCase(),
                mainheading: heading,
                faq: faqs[randomindexTitle],
              });
            } else {
              console.log("heading creation");
              const randomIndexHeading = getRandomInt(0, 3);
              await db.collection("coverheadingcatagories").add({
                headingName: heading,
                faq: faqs[randomIndexHeading],
                subHeadings: [coverdata.position.trim().toLowerCase()],
              });
              const randomindexTitle = getRandomInt(0, 3);
              await db.collection("covertitles").add({
                jobtitle: coverdata.position.trim().toLowerCase(),
                mainheading: heading,
                faq: faqs[randomindexTitle],
              });
            }
            if (!(data2.found > 0)) {
              const randomindex = getRandomInt(0, 3);
              await db.collection("covercompanies").add({
                companyName: coverdata.nameofcompany.trim().toLowerCase(),
                faq: faqcompanies[randomindex],
              });
            }
            await db.collection("coverletters").doc(id).set(
              {
                headingName: heading,
                imageGenerated: 1,
              },
              { merge: true }
            );
          }
        } else {
          console.log("not found headings");
        }
      } catch (err) {
        console.log("err", err);
      }
    } else {
      console.log("zero not generated");
    }
  } else {
    console.log("don't do anything");
  }
};

function cleanName(name) {
  let cleanedName = name.replace(/[^a-zA-Z ]/g, "").replace(/\s+/g, "-");
  return cleanedName;
}

async function getCompanyNameAndDomain(name) {
  const arrayOfToken = [
    "sk_1d125e99aff02e07d95fec7293de570d",
    "sk_94e9e1b4ae42c210dba765ef679c5cad",
    "sk_9c2707d01e61c791459136c1d89d64ce",
  ];
  const index = Math.floor(Math.random() * 3);
  console.log("here");
  try {
    const r = await axios.get(
      `https://company.clearbit.com/v1/domains/find?name=${name}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${arrayOfToken[index]}`,
        },
      }
    );
    console.log(r.data);
    return {
      ...r.data,
      name: cleanName(r.data.name),
    };
  } catch (err) {
    console.log("err", err.response.data);
    return {};
  }
}

const getWorkData = async (domain, tone, type) => {
  //domain to be used
  const type1 = `write a resignation letter for ${domain} also mention your contribution as ${domain} in your company in ${tone} tone`;
  const type2 = `Why do you want to work at ${domain} in ${tone} tone`;
  let finaltext = type == 1 ? type1 : type2;
  const openai = new OpenAIApi(configuration);
  const data = await new Promise(async (res, rej) => {
    try {
      const data = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: finaltext,
        temperature: 0.7,
        max_tokens: 1068,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      const replacerFunc = () => {
        const visited = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (visited.has(value)) {
              return;
            }
            visited.add(value);
          }
          return value;
        };
      };

      const x = JSON.stringify(data, replacerFunc());
      const heading = JSON.parse(x)?.data?.choices[0].text;
      res(heading);
    } catch (err) {
      console.log("err in openai", err?.message, err?.code);
      res("");
    }
  });
  return data;
};

const SearchTitleTypesense = async (jobTitle) => {
  const searchRequests = {
    q: "*",
    filter_by: `title:=${jobTitle}`,
  };
  try {
    const searchResponse = await clientTypesense
      .collections("job-titles")
      .documents()
      .search(searchRequests);
    // console.log(searchResponse);
    if (searchResponse.found == 1) {
      // console.log(searchResponse?.hits[0]?.document);
      return 1;
    }
  } catch (err) {
    console.log("err");
    return 0;
  }
};

function cleanString(input) {
  // Remove non-alphanumeric characters, excluding periods and slashes
  let cleaned = input.replace(/[^a-zA-Z0-9 .\/]/g, "");

  // Replace multiple spaces with a single space
  cleaned = cleaned.replace(/\s+/g, " ");

  // Trim leading and trailing spaces
  cleaned = cleaned.trim();
  console.log("cleanedstring", cleaned);
  return cleaned;
}

async function postProcessForResginationLetter(position) {
  if (position != "") {
    const cleanedTitle = cleanString(position);
    const titleWithDashses = cleanName(cleanedTitle);
    const found = await SearchTitleTypesense(cleanedTitle);
    if (found) {
      const ref = db.collection("resginationletterdata");
      const response1 = await db
        .collection("resginationletterdata")
        .where("title", "==", titleWithDashses)
        .get();

      const documentReferences = await db
        .collection("resginationletterdata")
        .listDocuments();

      const totalLength = documentReferences.length;

      if (response1.docs.length > 0) {
        console.log("present");
      } else {
        // else add here
        console.log("else");
        let mainid = totalLength + 1;

        const response0 = await db
          .collection("resginationletterdata")
          .where("mainId", "==", mainid - 1)
          .get();
        const response1 = await db
          .collection("resginationletterdata")
          .where("mainId", "==", mainid - 2)
          .get();
        const response2 = await db
          .collection("resginationletterdata")
          .where("mainId", "==", mainid - 3)
          .get();

        console.log(response0.docs[0], response1.docs[0], response2.docs[0]);
        let obj = {};
        let obj1 = {};
        let obj2 = {};
        if (response0.docs.length > 0) {
          obj = response0.docs[0].data();
          delete obj["links"];
          delete obj["informal"];
          delete obj["funny"];
          delete obj["professional"];
        }
        if (response1.docs.length > 0) {
          obj1 = response1.docs[0].data();
          delete obj1["links"];
          delete obj1["informal"];
          delete obj1["funny"];
          delete obj1["professional"];
        }
        if (response2.docs.length > 0) {
          obj2 = response2.docs[0].data();
          delete obj2["links"];
          delete obj2["informal"];
          delete obj2["funny"];
          delete obj2["professional"];
        }

        console.log("obj", obj, obj1, obj2);
        const funny = await getWorkData(cleanedTitle, "funny", 1);
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 2000);
        });
        const professional = await getWorkData(cleanedTitle, "professional", 1);
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 2000);
        });
        const informal = await getWorkData(cleanedTitle, "informal", 1);
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 2000);
        });

        let workdata = {
          informal: informal,
          funny: funny,
          professional: professional,
          title: titleWithDashses,
          mainId: totalLength + 1,
          links:
            mainid <= 3
              ? []
              : [
                  {
                    ...obj,
                  },
                  {
                    ...obj1,
                  },
                  {
                    ...obj2,
                  },
                ],
        };

        ref
          .add({
            ...workdata,
          })
          .then(function (result) {
            console.log("result", result);
          })
          .catch((err) => {
            console.log("err", err);
          });
      }
    } else {
      console.log("job title not found in typsense");
    }
  }
}

async function postProcessFoWork(companyName) {
  if (companyName != "") {
    const data = await getCompanyNameAndDomain(companyName.trim());
    if (Object.keys(data).length > 0) {
      const { name, domain, logo = "notfound" } = data;
      const ref = db.collection("whyworkat");
      const ref1 = db.collection("whyworkatmaindata");
      const response1 = await db
        .collection("whyworkat")
        .where("domain", "==", domain)
        .get();

      const documentReferences = await db
        .collection("whyworkat")
        .listDocuments();

      const totalLength = documentReferences.length;

      if (response1.docs.length > 0) {
        //present do nothing
        console.log("present");
      } else {
        // else add here
        console.log("else");
        let mainid = totalLength + 1;
        const response0 = await db
          .collection("whyworkat")
          .where("mainId", "==", mainid - 1)
          .get();
        const response1 = await db
          .collection("whyworkat")
          .where("mainId", "==", mainid - 2)
          .get();
        const response2 = await db
          .collection("whyworkat")
          .where("mainId", "==", mainid - 3)
          .get();

        let obj = response0.docs[0].data();
        delete obj["links"];
        let obj1 = response1.docs[0].data();
        delete obj1["links"];
        let obj2 = response2.docs[0].data();
        delete obj2["links"];

        ref
          .add({
            ...data,
            mainId: totalLength + 1,
            links: [
              {
                ...obj,
              },
              {
                ...obj1,
              },
              {
                ...obj2,
              },
            ],
          })
          .then(async function (result) {
            const id = result.id;
            console.log("id", id);
            const funny = await getWorkData(domain, "funny", 2);
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 2000);
            });
            const professional = await getWorkData(domain, "professional", 2);
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 2000);
            });
            const informal = await getWorkData(domain, "informal", 2);
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 2000);
            });
            let workdata = {
              informal: informal,
              funny: funny,
              professional: professional,
              ...data,
            };
            ref1
              .add({
                ...workdata,
              })
              .then(async (result) => {
                console.log("result", result);
              })
              .catch((err) => {
                console.log("err");
              });
          })
          .catch((err) => {
            console.log("err", err);
          });
      }
    } else {
      console.log("err occured");
    }
  }
}

const saveCover = (
  final,
  coverdata,
  website,
  dateInTimezone,
  ip,
  count,
  coverLetterPlanActiveStatus,
  newip
) => {
  const coverletter = final?.choices[0]?.text || "";
  const ref = db.collection("coverletters");
  ref
    .add({
      coverletter: coverletter,
      coverletterdata: coverdata,
    })
    .then((result) => {
      if (website && !coverLetterPlanActiveStatus) {
        if (Object.keys(ip).length > 0) {
          const ipMain = ip.ip;
          const mainRef = dbFree
            .collection("ipaddresscover")
            .doc(dateInTimezone)
            .collection(ipMain)
            .doc("details");
          mainRef.set({ count: count + 1 }, { merge: true });
        } else {
          if (newip != "") {
            const ipMain = newip;
            const mainRef = dbFree
              .collection("ipaddresscover")
              .doc(dateInTimezone)
              .collection(ipMain)
              .doc("details");
            mainRef.set({ count: count + 1 }, { merge: true });
          }
        }
      }
      postProcessForResginationLetter(coverdata?.position || "");
      postProcessFoWork(coverdata?.nameofcompany || "");
      postProcessAfterCover(result.id, coverdata, dateInTimezone, coverletter);
    })
    .catch((err) => {
      console.log("error occured in saving");
    });
};

const saveCoverGenerators = (
  final,
  data,
  dateInTimezone,
  ip,
  count,
  planActive,
  newip,
  type
) => {
  const generatedText = final?.choices[0]?.text || "";
  const collectionName = savegenerators[type] || null;
  const ipCollectionName = generators[type] || null;
  const ref = db.collection(collectionName);
  if (collectionName && ipCollectionName) {
    ref
      .add({
        generatedText: generatedText,
        data: data,
      })
      .then((result) => {
        if (!planActive) {
          if (Object.keys(ip).length > 0) {
            const ipMain = ip.ip;
            const mainRef = dbFree
              .collection(ipCollectionName)
              .doc(dateInTimezone)
              .collection(ipMain)
              .doc("details");
            mainRef.set({ count: count + 1 }, { merge: true });
          } else {
            if (newip != "") {
              const ipMain = newip;
              const mainRef = dbFree
                .collection(ipCollectionName)
                .doc(dateInTimezone)
                .collection(ipMain)
                .doc("details");
              mainRef.set({ count: count + 1 }, { merge: true });
            }
          }
        }
      })
      .catch((err) => {
        console.log("error occured in saving");
      });
  }
};

const saveCoverGeneratorsLinkedin = (final, data, dateInTimezone, type) => {
  const generatedText = final?.choices[0]?.text || "";
  const collectionName = savegenerators[type] || null;
  const ref = db.collection(collectionName);
  if (collectionName) {
    ref
      .add({
        generatedText: generatedText,
        data: { ...data, date: dateInTimezone },
      })
      .then((result) => {
        console.log("saved");
      })
      .catch((err) => {
        console.log("error occured in saving");
      });
  }
};

const getIpFromHeaders = (req) => {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",").shift() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress ||
    "";

  return ip;
};

let generators = {
  coverletter: "ipaddresscover",
  jobdescription: "ipaddressjobdescription",
  resignationletter: "ipaddressresignationletter",
  linkedinheading: "ipaddresslinkedinheading",
  linkedinrecommendation: "ipaddresslinkedinrecommendation",
  linkedindescription: "ipaddresslinkedindescription",
  resumejobdescription: "ipaddressresumejobdescription",
  linkedinhashtag: "linkedinhashtag",
};

let savegenerators = {
  coverletter: "coverletters",
  jobdescription: "jobdescriptioncollection",
  resignationletter: "resignationlettercollection",
  linkedinheading: "linkedinheadingcollection",
  linkedinheadingseperate: "linkedinheadingseperatecollection",
  linkedinrecommendation: "linkedinrecommendationcollection",
  linkedindescription: "linkedindescriptioncollection",
  resumejobdescription: "resumejobdescriptioncollection",
  linkedinhashtag: "linkedinhashtagcollection",
};

app.get("/getcovercount", async (req, res) => {
  const type =
    req.query["type"] != "undefined" && req.query["type"]
      ? req.query["type"]
      : "coverletter";
  const collectionName = generators[type];
  console.log("collection", collectionName);
  let date = new Date()
    .toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    })
    .replace(/\//g, "-");
  if (req.query["date"] != "undefined" && req.query["date"]) {
    date = req.query["date"];
  }

  let ip = getIpFromHeaders(req);
  if (req.query["ip"] != "undefined" && req.query["ip"]) {
    ip = req.query["ip"];
  }

  const mainRef = dbFree
    .collection(collectionName)
    .doc(date)
    .collection(ip)
    .doc("details");

  console.log(date, ip);
  const result = await new Promise((resolve, reject) => {
    mainRef
      .get()
      .then(function (docRef) {
        if (docRef.exists) {
          resolve({ count: docRef.data().count });
        }
        {
          resolve({ count: 0 });
        }
      })
      .catch((err) => {
        resolve({ count: 0 });
      });
  });
  res.send({ ...result });
});

const checkAndUpdateCoverLimitFromIp = async (
  dateInTimezone,
  ip,
  newip,
  type = "coverletter"
) => {
  const collectionName = generators[type];
  let ipMain = "",
    ipDetails = {};
  if (Object.keys(ip).length > 0) {
    ipMain = ip.ip;
    ipDetails = ip;
  } else {
    ipMain = newip;
    ipDetails = {
      ip: newip,
    };
  }
  const mainRef = dbFree
    .collection(collectionName)
    .doc(dateInTimezone)
    .collection(ipMain)
    .doc("details");
  return new Promise((resolve, reject) => {
    mainRef
      .get()
      .then(function (docRef) {
        if (docRef.exists) {
          console.log("docRef exist");
          let count = docRef.data().count;
          console.log("count", count);
          if (count < 5) {
            resolve({ count: count, message: "inlimit" });
          } else {
            resolve({ count: count, message: "notinlimit" });
          }
        } else {
          console.log("docRef did not exist");
          mainRef
            .set({ count: 1, ipDetails: ipDetails }, { merge: true })
            .then(() => {
              console.log("successfully created");
              resolve({ count: 1, message: "inlimit" });
            })
            .catch((err) => {
              console.log("error in creating");
              resolve({ count: 1, message: "inlimit" });
            });
        }
      })
      .catch((err) => {
        resolve({ count: 1, message: "inlimit" });
        console.log("some error occured", err);
      });
  });
};

app.post("/coverLetterMainHeadings", async (req, res) => {
  const title = req.body.title;
  const q = `Find the main headings for the title given below from the list of main headings. if title is not valid return 0 and if title is not found in the main headings answer a new heading.\nmainheadins - [\n  'human resources & management & leadership',\n  'education & learning',\n  'information technology (it)',\n  'engineering & scientific',\n  'administrative',\n  'marketing & sales',\n  'business',\n  'sales & marketing',\n  'customer service',\n  'accounting & finance',\n  'retail & customer service',\n  'healthcare & medicine & wellbeing',\n  'creative & cultural fields',\n  'safety & security',\n  'frontend',\n  'government and ngos',\n  'transportation',\n  'fire fighting & law enforcement & emergency',\n  'construction',\n  'medical',\n  'janitorial & manufacturing & warehousing',\n  'food service',\n  'hotel & hospitality & travel & transportation',\n  'data science',\n  'legal',\n  'research',\n  'finance & banking',\n  'finance & accounting',\n  'management & leadership',\n  'manufacturing & warehousing',\n  'research & development',\n  'environmental & sustainability',\n  'quality assurance & quality control',\n  'data science & data analytics',\n  'consulting & business analysis',\n  'logistics & supply chain management',\n  'project management',\n  'banking & financial services',\n  'software development & programming',\n  'international development & relief',\n  'legal & legal services',\n  'other'\n]\ntitle - digital marketing\nsales & marketing\n##\ntitle - Dean\neducation & learning\n##\ntitle - fewfweif\n0\n##\ntitle - abc\n0\n##\ntitle - ${title}`;
  const openai = new OpenAIApi(configuration);
  const data = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: q,
    temperature: 0.7,
    max_tokens: 1068,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const replacerFunc = () => {
    const visited = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (visited.has(value)) {
          return;
        }
        visited.add(value);
      }
      return value;
    };
  };

  const x = JSON.stringify(data, replacerFunc());
  res.send({ mainheading: JSON.parse(x)?.data });
});

const returnConvertedObj = (response) => {
  var lines = response.split(/\n/);
  var wrapped = "[" + lines.join(",") + "]";
  var obj = JSON.parse(wrapped);
  return obj;
};

const createLinks = (data, type) => {
  if (type === "CASE1") {
    return `https://lazyapply.com/cover-letter-examples/${encodeURIComponent(
      data.headingName
    )}-cover-letters`;
  } else if (type === "CASE2") {
    return `https://lazyapply.com/cover-letter-examples/${encodeURIComponent(
      data.companyName
    )}-cover-letter`;
  } else if (type === "CASE3") {
    const headingName = data.cover.headingName;
    const position = data.cover["coverletterdata.position"]
      .trim()
      .toLowerCase();
    const companyname = data.cover["coverletterdata.nameofcompany"]
      .trim()
      .toLowerCase();
    return `https://lazyapply.com/cover-letter-examples/${encodeURIComponent(
      headingName
    )}-cover-letters/${encodeURIComponent(
      position
    )}-cover-letter/${encodeURIComponent(companyname)}`;
  } else if (type === "CASE4") {
    const subheadings = data.headingValue.subHeadings;
    const headingName = data.headingValue.headingName;
    const keys = subheadings;
    const links = keys.map((key) => {
      return `https://lazyapply.com/cover-letter-examples/${encodeURIComponent(
        headingName
      )}-cover-letters/${encodeURIComponent(key)}-cover-letter`;
    });
    return links;
  }
};

const whyworkatlinks = async () => {
  console.log("x");
  const response = await clientTypesense
    .collections("whyworkat")
    .documents()
    .export({ exclude_fields: "links" });
  const mainresponse = returnConvertedObj(response);
  console.log(mainresponse.length);
  const links = mainresponse.map((value) => {
    return `https://lazyapply.com/interview-answer/why-do-you-want-to-work-at-${value.name}`;
  });
  console.log(links);
  return links;
};

const resignationletterlinks = async () => {
  console.log("x");
  const response = await clientTypesense
    .collections("resignationletterdata")
    .documents()
    .export({ exclude_fields: "links" });
  const mainresponse = returnConvertedObj(response);
  console.log(mainresponse.length);
  const links = mainresponse.map((value) => {
    return `https://lazyapply.com/resignation-letter/${value.title}-resignation-letter`;
  });
  console.log(links);
  return links;
};

app.get("/sitemapCreator", async (req, res) => {
  const response = await clientTypesense
    .collections("cover-letter-mainheadings")
    .documents()
    .export({ exclude_fields: "faq" });
  const response1 = await clientTypesense
    .collections("cover-letter-companies")
    .documents()
    .export({ exclude_fields: "faq" });
  // const response2 = await clientTypesense
  //   .collections("cover-letter-maindata")
  //   .documents()
  //   .export({ exclude_fields: "coverletter" });
  const headingsObj = returnConvertedObj(response);
  const companiesObj = returnConvertedObj(response1);
  // const coverMainObj = returnConvertedObj(response2);
  const links1 = headingsObj.map((headingValue) => {
    return createLinks({ headingName: headingValue.headingName }, "CASE1");
  });
  const links2 = companiesObj.map((companyValue) => {
    return createLinks({ companyName: companyValue.companyName }, "CASE2");
  });
  let links3 = [];
  headingsObj.forEach((headingValue) => {
    links3 = [
      ...links3,
      ...createLinks({ headingValue: headingValue }, "CASE4"),
    ];
  });
  const linkswhyworkat = await whyworkatlinks();
  const linksresignationletter = await resignationletterlinks();
  const alllinks = [
    ...links1,
    ...links2,
    ...links3,
    ...linkswhyworkat,
    ...linksresignationletter,
  ];
  res.send({ alllinks: alllinks });
});

const getAistring = (type, data) => {
  if (type === "jobdescription") {
    return `Create a job description in ${data.tone} with the sections including About company, Job Overview, Top Reasons To Work With Us, Roles And Responsibilities, Compensation, Qualifications , What's In It for You .  Details to create job description are mentioned below \ncompany url - ${data.companyurl}\nJob Title - ${data.jobtitle} \nSkills - ${data.skill}\nType Of Employment -  ${data.typeofemployment}\nJob Duration - ${data.jobduration}\nEquity - ${data.equity}\nEducation Qualification - ${data.education}\nCompensation - ${data.compensation}\nLocation Of Employment - ${data.location}\nJob Type - ${data.jobtype}\n Reporting To -  ${data.reportingto}\nRole In The Team - .${data.roleinteam}\nWork Hours - ${data.workinghours}\nRequired Year Of Experience - ${data.yearsofexperience}`;
  } else if (type === "resignationletter") {
    return `write a resignation letter containing  sections ( opening section, proper notice, the reason for leaving, intention to help with training,  thank you note  ) based on the detail mentioned below in about 5 paragraph\nresignation letter to - ${data.resignationletterto}\nresignation letter from - ${data.resignationletterfrom}\nto the company - ${data.tocompany}\nreason for resigning  - ${data.reasonforresignation}\nlast day of work - ${data.lastdayofwork}\nposition resigning from - ${data.position}`;
  } else if (type === "linkedinheading") {
    return `Write a linkedin heading / title for ${data.heading} in ${data.tone} tone taking inspiration from the headings array.\nheadings array - [ \"Seasoned B2B Sales Executive | Sold $1.3 million in 2019.\",\"Paid Ads Manager / Generated $12 million sales pipeline for manufacturing companies.\",\"Website and Blog Content Writer | Written 500k words in 2018.\",\n  \"Senior mechanical engineer | Designed wind turbines for Canadian renewable energy companies.\", \"Empathetic B2C Customer Support Rep / Never lets a customer go unhappy.\",\"Director of HR at ACME Corp | 12+ years experience in people management.\",\"Lifestyle Coach | Freelancer | Enabling high performers to live stress-free.\",\n  \"Digital marketing veteran open to opportunities in Media & Advertising.\",\"Converting data into actionable insights for leaders | Data Scientist | Financial Services.\",\"I love lending / Farm & agricultural loan processing | Mortgage & collateral expert.\",\"Experienced Chartered Financial Analyst looking for strategic roles in Insurance companies\",\n\"Project management professional seeking opportunities in the public sector.\",\"Content marketing enthusiast with a penchant for writing short-form content that sells.\",\"E-commerce Project Manager searching for roles in Consumer & Food Processing.\",\"Majored in Psychology, Finance, Economics | Student Coordinator, Placements.\",\n\"Communications, English, Public Relations | Community manager.\",\"Fashion stylist interned with haute couture magazines.\",\"MBA from Northwestern University, majoring in Information Technology.\",\n\"Culinary arts intern keen on delighting customers with delicious food.\",\"Investment banking intern enabling analysts to forecast financials across industries.\"\n]`;
  } else if (type === "linkedinheadingseperate") {
    return `Write a linkedin heading / title for ${data.heading} in ${data.tone} tone taking inspiration from the headings array.\nheadings array - [ \"Seasoned B2B Sales Executive | Sold $1.3 million in 2019.\",\"Paid Ads Manager / Generated $12 million sales pipeline for manufacturing companies.\",\"Website and Blog Content Writer | Written 500k words in 2018.\",\n  \"Senior mechanical engineer | Designed wind turbines for Canadian renewable energy companies.\", \"Empathetic B2C Customer Support Rep / Never lets a customer go unhappy.\",\"Director of HR at ACME Corp | 12+ years experience in people management.\",\"Lifestyle Coach | Freelancer | Enabling high performers to live stress-free.\",\n  \"Digital marketing veteran open to opportunities in Media & Advertising.\",\"Converting data into actionable insights for leaders | Data Scientist | Financial Services.\",\"I love lending / Farm & agricultural loan processing | Mortgage & collateral expert.\",\"Experienced Chartered Financial Analyst looking for strategic roles in Insurance companies\",\n\"Project management professional seeking opportunities in the public sector.\",\"Content marketing enthusiast with a penchant for writing short-form content that sells.\",\"E-commerce Project Manager searching for roles in Consumer & Food Processing.\",\"Majored in Psychology, Finance, Economics | Student Coordinator, Placements.\",\n\"Communications, English, Public Relations | Community manager.\",\"Fashion stylist interned with haute couture magazines.\",\"MBA from Northwestern University, majoring in Information Technology.\",\n\"Culinary arts intern keen on delighting customers with delicious food.\",\"Investment banking intern enabling analysts to forecast financials across industries.\"\n]`;
  } else if (type === "linkedinrecommendation") {
    return `write a linkedin recommendation in ${data.tone} tone for details below\nperson name - ${data.personname}\nRelationship with person - ${data.relationshipwithperson}\njob position at time - ${data.jobpositionattime}`;
  } else if (type === "linkedindescription") {
    return `write a linkedin description in ${data.tone} with sections ( overview ,  experience , work life description ,  accomplishments , what makes this person special , future plans , contribution to society ) with following details - \nPerson Name - ${data.personname}\nProfessional Experience - ${data.professionalexperience}\nEducation - ${data.education}\nSkills - ${data.skills}\nAccomplishments - ${data.accomplishments}\nIndustry Knowledge - ${data.industryknowledge}\nProfessional Organizations  - ${data.professionalorganizations}\nAwards & Recognition  - ${data.awards}\nPersonal Interests - ${data.personalintereset}`;
  } else if (type === "resumejobdescription") {
    return `create bullet points to add on resume which have following details \ntitle - ${data.title}\ndescription - ${data.description}`;
  } else if (type === "linkedinhashtag") {
    return `Generate trending linkedin post hashtags for \ntopic - ${data.topic}\ncountry - ${data.country}\ntarget audience - ${data.targetaudience}`;
  } else {
    return "";
  }
};

app.post("/lazyapply-generator-lazycv", async (req, res) => {
  const type = req.body.type;
  const objData = req.body.data;
  const finaltext = getAistring(type, objData);
  console.log("finaltext", finaltext);
  const openai = new OpenAIApi(configuration);
  const data = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: finaltext,
    temperature: 0.7,
    max_tokens: 1068,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const replacerFunc = () => {
    const visited = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (visited.has(value)) {
          return;
        }
        visited.add(value);
      }
      return value;
    };
  };

  const x = JSON.stringify(data, replacerFunc());
  const final = JSON.parse(x)?.data || {};
  res.send({ writerData: final });
});

app.post("/linkedin-headline-generator", async (req, res) => {
  let dateInTimezone = new Date()
    .toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    })
    .replace(/\//g, "-");
  const type = req.body.type;
  const objData = req.body.data;
  const finaltext = getAistring(type, objData);
  console.log("finaltext", finaltext);
  const openai = new OpenAIApi(configuration);
  const data = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: finaltext,
    temperature: 0.7,
    max_tokens: 1068,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const replacerFunc = () => {
    const visited = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (visited.has(value)) {
          return;
        }
        visited.add(value);
      }
      return value;
    };
  };
  const x = JSON.stringify(data, replacerFunc());
  const final = JSON.parse(x)?.data || {};
  saveCoverGeneratorsLinkedin(final, objData, dateInTimezone, type);
  res.send({ finalcoverletter: JSON.parse(x)?.data || {} });
});

app.post("/lazyapply-generator", async (req, res) => {
  let dateInTimezone = new Date()
    .toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    })
    .replace(/\//g, "-");
  const type = req.body.type;
  const newip = getIpFromHeaders(req);
  const ip = req.body?.ip || {};
  let count = 0;
  let message = "";
  const objData = req.body.data;
  const planActiveStatus = req.body?.planActive || false;
  console.log("planActiveStatus", planActiveStatus);
  if (req.body?.dateInTimezone && !planActiveStatus) {
    dateInTimezone = req.body.dateInTimezone;
    console.log("dateintimezone", dateInTimezone);
    console.log("present", dateInTimezone, ip);
    if (Object.keys(ip).length > 0 || newip != "") {
      const response = await checkAndUpdateCoverLimitFromIp(
        dateInTimezone,
        ip,
        newip,
        type
      );
      count = response.count;
      message = response.message;
      console.log("res", response);
    } else console.log("no ip found");
  }
  console.log("going here");
  if (message === "notinlimit") {
    res.send({ message: "limit excedeed", count: count });
  } else {
    const finaltext = getAistring(type, objData);
    console.log("finaltext", finaltext);
    const openai = new OpenAIApi(configuration);
    const data = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: finaltext,
      temperature: 0.7,
      max_tokens: 1068,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    const replacerFunc = () => {
      const visited = new WeakSet();
      return (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (visited.has(value)) {
            return;
          }
          visited.add(value);
        }
        return value;
      };
    };

    const x = JSON.stringify(data, replacerFunc());
    const final = JSON.parse(x)?.data || {};
    saveCoverGenerators(
      final,
      objData,
      dateInTimezone,
      ip,
      count,
      planActiveStatus,
      newip,
      type
    );
    res.send({ finalcoverletter: JSON.parse(x)?.data || {}, count: count });
  }
});

app.post("/coverletter", async (req, res) => {
  let dateInTimezone = new Date()
    .toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    })
    .replace(/\//g, "-");

  const newip = getIpFromHeaders(req);
  let website = 0;
  const ip = req.body?.ip || {};
  let count = 0;
  let message = "";
  const coverLetterPlanActiveStatus =
    req.body?.coverLetterPlanActiveStatus || false;
  console.log("coverletter", coverLetterPlanActiveStatus);
  if (req.body?.dateInTimezone && !coverLetterPlanActiveStatus) {
    website = 1;
    dateInTimezone = req.body.dateInTimezone;
    console.log("dateintimezone", dateInTimezone);
    console.log("present", dateInTimezone, ip);
    if (Object.keys(ip).length > 0 || newip != "") {
      const response = await checkAndUpdateCoverLimitFromIp(
        dateInTimezone,
        ip,
        newip,
        "coverletter"
      );
      count = response.count;
      message = response.message;
      console.log("res", response);
    } else console.log("no ip found");
  }
  console.log("going here");
  if (message === "notinlimit") {
    res.send({ message: "limit excedeed", count: count });
  } else {
    const coverletterdata = {
      position: req.body.position, //mandatory
      coverletterto: req.body.toname, // to
      experience: req.body.experience || "",
      myname: req.body.myname, // from
      nameofcompany: req.body.companyname, //company
      skills: req.body.skills,
      roletype: req.body.roletype,
      location: req.body.location,
      dateInTimezone: dateInTimezone,
      tone: req.body.tone || "Convincing",
    };
    let positionfinaltext = "";
    if (coverletterdata.position != "") {
      positionfinaltext = `position - ${coverletterdata.position}\n`;
    }
    let experiencefinaltext = "";
    if (coverletterdata.experience != "") {
      experiencefinaltext = `experience -  ${coverletterdata.experience}\n`;
    }
    let skillfinaltext = "";
    if (coverletterdata.skills != "") {
      skillfinaltext = `skills - ${coverletterdata.skills}\n`;
    }
    let locationfinaltext = "";
    if (coverletterdata.location != "") {
      locationfinaltext = `location preference - ${coverletterdata.location} preferred\n`;
    }
    let roletypefinal = "";
    if (coverletterdata.roletype != "") {
      roletypefinal = `role type - ${coverletterdata.roletype} role\n`;
    }

    const finaltext = `Write a cover letter in ${coverletterdata.tone} tone for the person with name ${coverletterdata.coverletterto} with below details \n${positionfinaltext}${experiencefinaltext}my name - ${coverletterdata.myname}\nname of company for cover letter - ${coverletterdata.nameofcompany}\n${skillfinaltext}${roletypefinal}${locationfinaltext}in more than 1000 words and mention some details about what i like about this particular position in company and give more information about my skills.\n\n`;
    console.log("finaltext", finaltext);
    const openai = new OpenAIApi(configuration);
    const data = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: finaltext,
      temperature: 0.7,
      max_tokens: 1068,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    const replacerFunc = () => {
      const visited = new WeakSet();
      return (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (visited.has(value)) {
            return;
          }
          visited.add(value);
        }
        return value;
      };
    };

    const x = JSON.stringify(data, replacerFunc());
    const final = JSON.parse(x)?.data || {};
    saveCover(
      final,
      coverletterdata,
      website,
      dateInTimezone,
      ip,
      count,
      coverLetterPlanActiveStatus,
      newip
    );
    res.send({ finalcoverletter: JSON.parse(x)?.data || {}, count: count });
  }
});

app.post("/savesessionv2", authenticateToken, (req, res) => {
  const email = req.user.email;
  let sessionObj = req.body.session;
  let sessionLinks = req.body.sessionLinks;
  let sessionLinksBefore = req.body.sessionLinksBefore;
  sessionObj.sessionLinks = sessionLinks;
  sessionObj.sessionLinksBefore = sessionLinksBefore;
  mixpanel.track("jobs applied", {
    distinct_id: email,
    totaljobs: sessionObj.count,
    platformName: sessionObj.platformName,
  });
  sessionObj.createdAt = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("users").doc(email).collection("session");
  docRef
    .add(sessionObj)
    .then(() => {
      console.log("save session -----> success");
      res.send("success updated");
    })
    .catch(async (error) => {
      if (
        error?.details.includes(
          "exceeds the maximum allowed size of 1,048,576 bytes"
        )
      ) {
        const samesessionuid = uuidv4();
        await recursiveCall(sessionObj, email, samesessionuid);
        res.send("success updated");
      } else {
        console.log(error);
        res.send("error");
      }
    });
});

app.post("/addlazylink", async (req, res) => {
  const title = req.body.title;
  const url = req.body.url;
  const token = req.body.token;
  const name = req.body.name;
  console.log("name", name);
  if (token === process.env.LAZYLINKTOKEN) {
    const mainRef = dbFree.collection("lazylinks").doc(name);
    const response = await new Promise((resolve, reject) => {
      mainRef
        .get()
        .then(async (doc) => {
          if (doc.exists) {
            const links = doc.data()?.links || [];
            let present = 0;
            links.forEach((linkobj) => {
              if (linkobj.url === url) {
                present = 1;
              }
            });
            if (present) {
              console.log("present");
              resolve({ message: "Already present" });
            } else {
              console.log("not present");
              try {
                const data = await mainRef.set(
                  {
                    links: [
                      ...links,
                      {
                        title,
                        url,
                        logo: "https://content.lazyapply.com/lazyapply.ico",
                      },
                    ],
                  },
                  { merge: true }
                );
                console.log("data", data);
                resolve({ message: "Added successfully" });
              } catch (err) {
                resolve({ message: "Link not added, some error occured" });
              }
            }
          } else {
            console.log("doc did not exist");
            resolve({ message: "Name does not exist yet" });
          }
        })
        .catch((error) => {
          console.log(error);
          resolve({ message: "Link not added, some error occured" });
        });
    });
    res.send(response);
  } else {
    res.send({ message: "token incorrect" });
  }
});

app.get("/addlazylink", async (req, res) => {
  const token = req.query.token;
  const name = req.query.name;
  console.log("name", name);
  if (token === process.env.LAZYLINKTOKEN) {
    const mainRef = dbFree.collection("lazylinks").doc(name);
    const response = await new Promise((resolve, reject) => {
      mainRef
        .get()
        .then(async (doc) => {
          if (doc.exists) {
            const links = doc.data()?.links || [];

            resolve({ links: links });
          } else {
            resolve({ links: [] });
          }
        })
        .catch((error) => {
          resolve({ links: [] });
        });
    });
    res.send(response);
  } else {
    res.send({ links: [] });
  }
});

app.post("/savesessionupdated", authenticateToken, (req, res) => {
  console.log("savesessionupdatedcall");
  const email = req.user.email;
  let sessionObj = req.body.session;
  let sessionLinks = req.body.sessionLinks;
  sessionObj.sessionLinks = sessionLinks;
  console.log(sessionLinks);
  let name = "";
  if (sessionObj.platformName == "indeed") {
    name = "indeedJobApplicationLinksFinal";
  } else if (sessionObj.platformName == "ziprecruiter") {
    name = "ziprecruiterJobApplicationLinksFinal";
  } else {
    name = "linkedinJobApplicationLinksFinal";
  }
  mixpanel.track("jobs applied", {
    distinct_id: email,
    totaljobs: sessionObj.count,
    platformName: sessionObj.platformName,
  });
  sessionObj.createdAt = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("users").doc(email).collection("session");
  const mainRef = db.collection("users").doc(email);
  mainRef
    .get()
    .then((resp) => {
      console.log(resp);
      // let variable = initJobsAppliedData(resp.data());
      // console.log("variable", variable);
      if (name in resp.data()) {
        //update
        // let a = resp.data()[name];
        // if (name === "linkedinJobApplicationLinksFinal") {
        //   const map = new Map();
        //   const array2 = a;
        //   const array1 = sessionLinks;
        //   array1.forEach((item) => map.set(item.href, item));
        //   array2.forEach((item) => {
        //     if (typeof item === "object" && item != null) {
        //       map.set(item.href, { ...map.get(item.href), ...item });
        //     } else {
        //       if (map.get(item)) {
        //         map.set(item, { ...map.get(item), href: item });
        //       } else {
        //         map.set(item, item);
        //       }
        //     }
        //   });
        //   const mergedArr = Array.from(map.values());
        //   a = mergedArr;
        // } else if (name === "ziprecruiterJobApplicationLinksFinal") {
        //   const map = new Map();
        //   const array2 = a;
        //   const array1 = sessionLinks;
        //   array1.forEach((item) => {
        //     if (item) {
        //       let mainhref = item.id;
        //       map.set(mainhref, item);
        //     }
        //   });
        //   array2.forEach((item) => {
        //     if (item) {
        //       let mainhref = item.id;
        //       map.set(mainhref, { ...map.get(mainhref), ...item });
        //     }
        //   });
        //   const mergedArr = Array.from(map.values());
        //   a = mergedArr;
        //   console.log("finalmergedarray", a.length, sessionLinks.length);
        // } else {
        //   a = [...a, ...sessionLinks];
        // }
        // variable = jobsAppliedData(variable, a.length, name);
        sessionObj.sessionLinks = sessionObj.sessionLinks;

        docRef
          .add(sessionObj)
          .then(() => {
            console.log("save session -----> success");
            res.send("success updated");
            // mainRef
            //   .update({
            //     [name]: a,
            //   })
            //   .then((resp) => {
            //     console.log("success0");
            //     addmailingfn(email, mailingjson.jobsapplied, variable);
            //     res.send("success updated");
            //   })
            //   .catch((err) => {
            //     console.log("error0", err);
            //     res.send("error", err);
            //   });
          })
          .catch((error) => {
            console.log(error);
            res.send("error");
          });
      } else {
        //set
        docRef
          .add(sessionObj)
          .then(() => {
            console.log("save session -----> success");
            res.send("success updated");
            // mainRef
            //   .set({ [name]: sessionLinks }, { merge: true })
            //   .then((resp) => {
            //     console.log("success1");
            //     addmailingfn(email, mailingjson.jobsapplied, variable);
            //     res.send("success updated");
            //   })
            //   .catch((err) => {
            //     console.log("error1");
            //     res.send("error");
            //   });
          })
          .catch((error) => {
            console.log("error3");
            res.send("error");
          });
      }
    })
    .catch((err) => {
      console.log("error2");
      res.send("error");
      console.log(err);
    });
});

//Saves the emails from view email section
app.post("/saveEmails", authenticateToken, (req, res) => {
  const email = req.user.email;
  let profileData = req.body.profileData;
  const docRef = db.collection("users").doc(email).collection("sessionEmails");
  docRef
    .doc(profileData.person.email)
    .set(profileData)
    .then(() => {
      console.log("save session emails -----> success");
      res.send("success updated");
    })
    .catch((error) => {
      console.log(error);
      res.send("error");
    });
});

//Saves the emails from view email section
app.get("/getEmails", authenticateToken, (req, res) => {
  const email = req.user.email;
  const docRef = db.collection("users").doc(email).collection("sessionEmails");
  docRef
    .get()
    .then((r) => {
      console.log(r);
      let value = [];
      r.forEach((data) => {
        console.log("r", data.data());
        value.push(data.data());
      });
      res.send(value);
    })
    .catch((error) => {
      console.log(error);
      res.send("error");
    });
});

//Saves the current session
app.post("/savesession", authenticateToken, (req, res) => {
  const email = req.user.email;
  let sessionObj = req.body.session;
  let sessionLinks = req.body.sessionLinks;
  sessionObj.sessionLinks = sessionLinks;
  let name = "";
  if (sessionObj.platformName == "indeed") {
    name = "indeedJobApplicationLinksFinal";
  } else {
    name = "linkedinJobApplicationLinksFinal";
  }

  sessionObj.createdAt = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("users").doc(email).collection("session");
  const mainRef = db.collection("users").doc(email);
  mainRef
    .get()
    .then((resp) => {
      console.log(resp);
      if (name in resp.data()) {
        //update
        // let a = resp.data()[name];
        // a = [...a, ...sessionLinks];
        // sessionObj.sessionLinks = sessionObj.sessionLinks;

        docRef
          .add(sessionObj)
          .then(() => {
            console.log("save session -----> success");
            res.send("success updated");
            // mainRef
            //   .update({
            //     [name]: a,
            //   })
            //   .then((resp) => {
            //     console.log(resp);
            //     res.send("success updated");
            //   })
            //   .catch((err) => {
            //     console.log("error");
            //     res.send("error");
            //   });
          })
          .catch((error) => {
            console.log(error);
            res.send("error");
          });
      } else {
        //set

        docRef
          .add(sessionObj)
          .then(() => {
            console.log("save session -----> success");
            res.send("success updated");
            // mainRef
            //   .set({ [name]: sessionLinks }, { merge: true })
            //   .then((resp) => {
            //     console.log(resp);
            //     res.send("success updated");
            //   })
            //   .catch((err) => {
            //     console.log("error");
            //     res.send("error");
            //   });
          })
          .catch((error) => {
            console.log(error);
            res.send("error");
          });
      }
    })
    .catch((err) => {
      res.send("error");
      console.log(err);
    });
});

// app.get("/listallemaildomains", (req, res) => {
//   aws.config.update({
//     region: "us-west-2",
//     accessKeyId: "AKIAXUEEQ6FOS67VJ4ZV",
//     secretAccessKey: "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",
//   });

//   var params = {
//     IdentityType: "Domain",
//     MaxItems: 10,
//   };

//   var listIDsPromise = new aws.SES().listIdentities(params).promise();

//   // Handle promise's fulfilled/rejected states
//   listIDsPromise
//     .then(function (data) {
//       console.log("response", data.Identities);
//       res.send(data.Identities);
//     })
//     .catch(function (err) {
//       console.error("err", err, err.stack);
//     });
// });

app.get("/verifyemail/:email", (req, res) => {
  const email = req.params["email"];
  aws.config.update({
    region: "us-west-2",
    accessKeyId: "AKIAXUEEQ6FOS67VJ4ZV",
    secretAccessKey: "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",
  });

  // Create promise and SES service object
  var verifyEmailPromise = new aws.SES()
    .verifyEmailIdentity({ EmailAddress: email })
    .promise();

  // Handle promise's fulfilled/rejected states
  verifyEmailPromise
    .then(function (data) {
      console.log("Email verification initiated", data);
      res.send("success initiated");
    })
    .catch(function (err) {
      console.error("err", err, err.stack);
    });
});

// app.get("/sendCustomEmail/:email", (req, res) => {
//   const email = req.params["email"];
//   aws.config.update({
//     region: "us-west-2",
//     accessKeyId: "AKIAXUEEQ6FOS67VJ4ZV",
//     secretAccessKey: "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",
//   });
//   // Creating SES service object
//   var ses = new aws.SES();

//   const params = {
//     ConfigurationSetName:'LazyApply-X',
//     EmailAddress:email,
//     TemplateName:'LazyApplyX'
//   }
//   ses.sendCustomVerificationEmail(params, function (err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else console.log(data); // successful response
//   });
// });

// app.get("/custom-email-template", (req, res) => {
//   aws.config.update({
//     region: "us-west-2",
//     accessKeyId: "AKIAXUEEQ6FOS67VJ4ZV",
//     secretAccessKey: "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",
//   });

//   // creating SES service object
//   var ses = new aws.SES();
//   ses.createCustomVerificationEmailTemplate(emailJson, function (err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else console.log("data", data); // successful response
//   });
// });

function replaceAllExceptFirst(str, search, replace) {
  return str
    .split(search)
    .reduce((prev, curr, i) => prev + (i == 1 ? search : replace) + curr);
}

const replaceWithAnchor = (text, promotion) => {
  if (promotion) {
    let t1 = text.replace("lazyapply", "https://lazyapply.com ");
    t1 = t1.replace("Lazyapply", "https://lazyapply.com ");
    t1 = replaceAllExceptFirst(t1, "https://lazyapply.com", "lazyapply");
    return t1;
  } else {
    let t1 = text.replace("lazyapply", "lazyapply ");
    t1 = t1.replace("Lazyapply", "Lazyapply ");
    return t1;
  }
};

const titles = [
  "LazyApply - Job Application Automation",
  "LazyApply - Automatic Job Applier",
  "LazyApply - Single Click Job Applier",
  "LazyApply - Automate Job Application",
  "LazyApply - Job Application Autofiller",
  "LazyApply - Autofill Job Application",
  "LazyApply - Automate Job Search",
  "LazyApply - One Click Job Application",
  "LazyApply - One Click Job Application",
];

const probableOutput = (percentage) => {
  if (percentage == 0) {
    return false;
  } else if (percentage == 1) {
    return true;
  } else {
    var random_boolean = Math.random() < percentage;
    return random_boolean;
  }
};

app.get("/allpost", (req, res) => {
  const name = req.query["userId"];
  const mainRef = dbFree.collection("quoraPosts").doc(name);
  mainRef
    .get()
    .then(function (docRef) {
      if (docRef.exists) {
        res.send({ ...docRef.data() });
      } else {
        res.send({});
      }
    })
    .catch((err) => {
      console.log("some error occured");
      res.send({});
    });
});

app.post("/allpost", (req, res) => {
  const name = req.query["userId"];
  const mainRef = dbFree.collection("quoraPosts").doc(name);
  const link = req.body.link;
  const text = req.body.text;
  mainRef
    .set(
      {
        [uuidv4()]: {
          link,
          text,
        },
      },
      { merge: true }
    )
    .then(function () {
      res.send({ msg: "success" });
    })
    .catch((err) => {
      console.log("some error occured");
      res.send({ msg: "error" });
    });
});

// app.post("/bloghtml", async (req, res) => {
//   const question = req.body.question;
//   const openai = new OpenAIApi(configuration);
//   const data = await openai.createCompletion({
//     model: "text-davinci-002",
//     prompt: `Give HTML code with details given.\nthe blog length is more than 2000+ words the blog must have 2+ headings, 2 +subheadings and a conclusion the topic of the blog is "${question}"`,
//     temperature: 0.5,
//     max_tokens: 4000,
//     top_p: 1,
//     frequency_penalty: 0,
//     presence_penalty: 0,
//   });
//   console.log(data)
//   const x = data?.data?.choices[0]?.text || "";
//   res.send({
//     blogHtml: x,
//   });
// });

app.post("/fillquora", async (req, res) => {
  const question = req.body.question;
  const percentage = req.body.percentage;
  const promotion = probableOutput(percentage);
  const type = req.body?.type || "lazyapply";
  const userId = req.body?.userId || "";
  console.log(question, "question");
  const token = req.body.token;
  if (token == process.env.QUORATOKEN) {
    const openai = new OpenAIApi(configuration);
    const data = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: `Write a blog on topic mentioned below in 300 words ?\n${question}`,
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    let data1 = {};
    if (type === "lazyapply") {
      if (userId === "support@resumebuilder.io") {
        data1 = await openai.createCompletion({
          model: "text-davinci-002",
          prompt: `Promote resumebuilder.io in about 50 words`,
          temperature: 0.5,
          max_tokens: 1167,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
      } else {
        data1 = await openai.createCompletion({
          model: "text-davinci-002",
          prompt: `Promote lazyapply.com in context of the below question in 50 words from the information about lazyapply shown below in 4 points.\n1. Automatically apply to 1000s of jobs in one click.\n2. Apply for jobs in hundred times faster using lazyapply.\n3. Automate job portals like linkedin, indeed, ziprecruiter etc and apply for 100s of jobs in single click.\n4. Automates your job search on platform like Linkedin, Indeed and Ziprecruiter. Create your profile, Choose your job search parameters like ( remote, fulltime, salary,.) and apply for 1000's of jobs in single click.\n${question}`,
          temperature: 0.5,
          max_tokens: 1167,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
      }
    } else {
      console.log("do nothing");
    }
    const x = data?.data?.choices[0]?.text || "";
    const x2 = data1?.data?.choices[0]?.text || "";
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    res.send({
      data: {
        main: x,
        promote: replaceWithAnchor(x2, promotion),
      },
      title: titles[getRandomInt(0, 8)],
    });
  } else {
    res.send({ data: "", title: "" });
  }
});

app.post("/audiox", async (req, res) => {
  const content = req.body.content;
  const token = req.body.token;
  const userid = req.body.userid;
  if (token == process.env.AUDIOX_CODE) {
    console.log("content", content, userid);
    const openai = new OpenAIApi(configuration);
    const data = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: `List down all the mistakes the person made professionally and gramatically in text given below\n${content}`,
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    const x = data?.data?.choices[0]?.text || "";
    res.send({ data: x });
  } else {
    res.send({ data: "" });
  }
});

app.post("/changeToLastStep", authenticateToken, async (req, res) => {
  const email = req.user.email;
  try {
    const mainRef = db.collection("targetSearchUserDetails").doc(email);
    const mainRef1 = db.collection("targetSearchUsers").doc(email);
    const docRef = await mainRef.get();
    const docRef1 = await mainRef1.get();
    if (docRef1.exists) {
      const data = docRef.data();
      const data1 = docRef1.data();
      if ("sampleEmailGenerated" in data1) {
        console.log("already generated", data1.sampleEmailGenerated);
        res.send({ emailGenerated: data1.sampleEmailGenerated, stepNo: 2 });
      } else {
        const url =
          "https://targetedsearch.s3.ap-south-1.amazonaws.com/" +
          data.resumeReferenceId;
        try {
          const response = await axios.post(
            `https://chatpdf.lazyapply.com/customemail`,
            {
              companyinfo:
                "Facebook is an online social media and social networking service owned by American technology giant Meta Platforms.",
              companydomain: "facebook.com",
              fromname: data.full_name,
              toname: "Michael",
              jobtitle: data.title,
              link: url,
            }
          );
          console.log("response", response);

          if (response.data.parsed) {
            await db.collection("targetSearchUsers").doc(email).set(
              {
                sampleEmailGenerated: response.data.response,
              },
              { merge: true }
            );
            res.send({ emailGenerated: response.data.response, stepNo: 2 });
          } else {
            res.send({ emailGenerated: "", stepNo: 2 });
          }
        } catch (err) {
          console.log("error", err);
          res.send({ emailGenerated: "", stepNo: 2 });
        }
      }
    } else {
      console.log("user details error");
      res.send({ emailGenerated: "", stepNo: 2 });
    }
  } catch (err) {
    res.send({ emailGenerated: "", stepNo: 2 });
  }
});

app.get("/getCompanies/:id", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const v2Id = email + "v2Id";
  const uniqueId = req.params["id"];
  const response1 = await db
    .collection("v2collection")
    .doc("targetSearchSessions")
    .collection(v2Id)
    .where("uniqueId", "==", uniqueId)
    .get();

  if (response1.docs.length > 0) {
    console.log(response1.docs[0].data());
    res.send({
      processCompleted: response1.docs[0].data().processCompleted,
      processStartedStep: response1.docs[0].data().processStartedStep,
      emailsSent: response1.docs[0].data().emailsSent,
      uniqueId: response1.docs[0].data().uniqueId,
      companies: response1.docs[0].data()?.companies || [],
      createdAt: response1.docs[0].data().createdAt,
    });
  } else {
    res.send({
      processCompleted: 0,
      processStartedStep: 1,
      emailsSent: 0,
      uniqueId: uniqueId,
      companies: [],
    });
  }
});

app.post("/getCompanies", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const uniqueId = req.body.id;
  const v2Id = email + "v2Id";
  const createdAt = admin.firestore.FieldValue.serverTimestamp();
  let result = [];
  let dateInTimezone = new Date()
    .toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    })
    .replace(/\//g, "-");
  const response = await db.collection("targetSearchUsers").doc(email).get();
  const response1 = await db
    .collection("targetSearchUserDetails")
    .doc(email)
    .get();
  if (response.exists && response1.exists) {
    const targetSearchData = response.data();
    const userDetails = response1.data();
    console.log("exist", userDetails, targetSearchData);
    try {
      let domainsToExcludeString = "";
      if (userDetails.companiesisnotanyof) {
        userDetails.companiesisnotanyof.forEach((x, index) => {
          if (index === 0) {
            domainsToExcludeString += "domainsToExclude=";
          }
          domainsToExcludeString += x.value;
          if (!(index === userDetails.companiesisnotanyof.length - 1)) {
            domainsToExcludeString += ",";
          }
        });
      }
      let industryisanyof = [];
      if (userDetails.industryisanyof) {
        userDetails.industryisanyof.forEach((x, index) => {
          industryisanyof.push(x.value);
        });
      }
      let industryisnotanyof = [];
      if (userDetails.industryisnotanyof) {
        userDetails.industryisnotanyof.forEach((x, index) => {
          industryisnotanyof.push(x.value);
        });
      }
      let employees = [];
      if (userDetails.employees) {
        userDetails.employees.forEach((x, index) => {
          employees.push(x.value);
        });
      }
      let countries = [];
      if (userDetails.countries) {
        userDetails.countries.forEach((x, index) => {
          countries.push(x.value);
        });
      }
      let cities = [];
      if (userDetails.cities) {
        userDetails.cities.forEach((x, index) => {
          cities.push(x.value);
        });
      }
      let finalFilterString = [];
      if (employees.length > 0) {
        finalFilterString.push({
          attribute: "totalEmployees",
          operator: "or",
          sign: "equals",
          values: employees,
        });
      }
      if (countries.length > 0) {
        finalFilterString.push({
          attribute: "country.code",
          operator: "or",
          sign: "equals",
          values: countries,
        });
      }
      if (cities.length > 0) {
        finalFilterString.push({
          attribute: "city.code",
          operator: "or",
          sign: "equals",
          values: cities,
        });
      }
      if (industryisanyof.length > 0) {
        finalFilterString.push({
          attribute: "industries",
          operator: "or",
          sign: "equals",
          values: industryisanyof,
        });
      }
      if (industryisnotanyof.length > 0) {
        finalFilterString.push({
          attribute: "industries",
          operator: "or",
          sign: "notEquals",
          values: industryisnotanyof,
        });
      }

      const size = targetSearchData?.companySize || 20;
      let url = `https://api.thecompaniesapi.com/v1/companies?token=BB6wLOVu&size=${size}&page=${targetSearchData.nextPage}`;
      if (finalFilterString.length > 0) {
        const newEncodedString = encodeURIComponent(
          JSON.stringify(finalFilterString)
        );
        url += `&query=${newEncodedString}`;
      }
      if (domainsToExcludeString != "") {
        url += `&${domainsToExcludeString}`;
      }
      console.log("url", url);
      const { data } = await axios.get(url);
      console.log("data", data.companies.length, data.meta);
      data.companies.forEach((c) => {
        result.push({
          descriptionShort: c?.descriptionShort || "",
          domain: c.domain,
          id: c.id,
          industries: c.industries,
          logo: c?.logo || "",
          name: c.name,
          revenue: c?.revenue || "",
          totalEmployees: c?.totalEmployees,
          yearFounded: c.yearFounded,
        });
      });
      const response1 = await db
        .collection("targetSearchUsers")
        .doc(email)
        .set(
          {
            ...targetSearchData,
            nextPage: targetSearchData.nextPage + 1,
          },
          { merge: true }
        );
      console.log("response1", response1, uniqueId);

      const response2 = await db
        .collection("v2collection")
        .doc("targetSearchSessions")
        .collection(v2Id)
        .doc(uniqueId)
        .set(
          {
            processCompleted: 0,
            processStartedStep: 1,
            companiesFetched: 1,
            emailsSent: 0,
            emailsFetched: 0,
            page: targetSearchData.nextPage,
            meta: data.meta,
            createdAt: createdAt,
            companiesCount: result.length,
            uniqueId: uniqueId,
            companies: result,
            dateInTimezone: dateInTimezone,
          },
          {
            merge: true,
          }
        );
      console.log("response2", response2);
    } catch (err) {
      console.log("err", err);
    }
    res.send({ companies: result, uniqueId: uniqueId });
  } else {
    res.send({ companies: result, uniqueId: uniqueId });
  }
});

app.post("/sendIndividualEmails", async (req, res) => {
  if (process.env.SEND_INDIVIDUAL_EMAIL === req.body.secret_key) {
    const { messages, uniqueId, email } = req.body;
    const sqs = new aws.SQS({
      region: "us-west-1",
      accessKeyId: "AKIAXUEEQ6FOV7SDN674",
      secretAccessKey: "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",
    });
    const accountId = "524263944541";
    const queueName = "send-individual-email-queue.fifo";
    for (var i = 0; i < messages.length; ) {
      var params = {
        QueueUrl: `https://sqs.us-west-1.amazonaws.com/${accountId}/${queueName}`,
        Entries: [],
      };
      for (var j = 0; j < 10 && i < messages.length; i++, j++) {
        const messageBody = messages[i];
        params.Entries.push({
          MessageGroupId: uuidv4(),
          Id: i.toString(),
          MessageBody: JSON.stringify({
            ...messageBody,
            email: email,
            uniqueId: uniqueId,
            isLast: i === messages.length - 1 ? true : false,
          }),
        });
      }
      const response = await sqs.sendMessageBatch(params).promise();
      console.log("response", response);
    }
    res.send({ message: "success" });
  } else {
    res.send({ message: "some error occured" });
  }
});

app.get("/lazyapplyxSessionsToday", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const v2Id = email + "v2Id";
  let startdate = new Date();
  startdate.setHours(0, 0, 0, 0);
  let enddate = new Date();
  enddate.setHours(23, 59, 59, 999);
  console.log(startdate, enddate);
  const mainRef = db
    .collection("v2collection")
    .doc("targetSearchSessions")
    .collection(v2Id)
    .where("createdAt", ">=", startdate)
    .where("createdAt", "<=", enddate)
    .orderBy("createdAt");

  try {
    let data = await mainRef.get();
    if (data.size > 0) {
      let sessions = [];
      data.forEach((d) => {
        sessions.push(d.data());
      });
      res.send({
        session: sessions,
        status: true,
      });
    } else {
      res.send({
        status: false,
        session: [],
      });
    }
    console.log("end");
  } catch (err) {
    console.log("Error getting documents", err);
    res.status(400).json({ error: "Something went wrong" });
  }
});

app.get("/lazyapplyxSessions", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const v2Id = email + "v2Id";
  const mainRef = db
    .collection("v2collection")
    .doc("targetSearchSessions")
    .collection(v2Id);
  let startdate = new Date();
  startdate.setHours(0, 0, 0, 0);
  let enddate = new Date();
  enddate.setHours(23, 59, 59, 999);
  console.log(startdate, enddate);
  let value = [];
  let length = 0;
  let totalsessions = 0;
  mainRef
    .get()
    .then(async function (docRef) {
      // console.log(docRef.size);
      if (docRef.size > 0) {
        docRef.forEach((data) => {
          if (data.data() && "companiesCount" in data.data()) {
            if (data.data().processCompleted) {
              length += data.data().companiesCount;
            }
          }
          value.push({
            createdAt: data.data().createdAt,
            emailsSent: data.data().emailsSent,
            processCompleted: data.data().processCompleted,
            processStartedStep: data.data().processStartedStep,
            uniqueId: data.data().uniqueId,
            companiesCount: data.data().companiesCount,
            companiesFetched: data.data().companiesFetched,
            emailsSent: data.data().emailsSent,
            emailsFetched: data.data().emailsFetched,
          });
        });

        totalsessions = docRef.size;
        res.send({
          totalsessions: value,
          totalsessionslength: totalsessions,
          companiesCount: length,
        });
      } else {
        res.send({
          totalsessions: [],
          totalsessionslength: 0,
          companiesCount: 0,
        });
      }
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
      res.status(400).json({ error: "Something went wrong" });
    });
});

app.post("/lazyapplyXGetEmails", authenticateToken, async (req, res) => {
  // Create SQS service client
  const sqs = new aws.SQS({
    region: "us-west-1",
    accessKeyId: "AKIAXUEEQ6FOV7SDN674",
    secretAccessKey: "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",
  });
  const email = req.user.email;
  const uniqueId = req.body.uniqueId;
  const accountId = "524263944541";
  const queueName = "Find-Emails-Queue.fifo";
  const id = uuidv4();
  const v2Id = email + "v2Id";
  const dataResponse = await db
    .collection("v2collection")
    .doc("targetSearchSessions")
    .collection(v2Id)
    .doc(uniqueId)
    .get();

  let companies = [];

  if (dataResponse) {
    companies = dataResponse.data()?.companies || [];
  }

  // Setup the sendMessage parameter object
  const params = {
    MessageGroupId: uuidv4(),
    MessageBody: JSON.stringify({
      userId: email,
      id: id,
      uniqueId: uniqueId,
      date: new Date().toISOString(),
      messageType: "getEmails",
      messageData: {
        companies: companies,
      },
    }),
    QueueUrl: `https://sqs.us-west-1.amazonaws.com/${accountId}/${queueName}`,
  };
  const response = await new Promise((resolve) => {
    sqs.sendMessage(params, async (err, data) => {
      if (err) {
        console.log("Error", err);
        resolve({ message: "error", messageId: "" });
      } else {
        console.log("Successfully added message", data.MessageId);
        await db
          .collection("v2collection")
          .doc("targetSearchSessions")
          .collection(v2Id)
          .doc(uniqueId)
          .set(
            {
              processStartedStep: 2,
            },
            { merge: true }
          );
        resolve({ message: "success", messageId: data.MessageId });
      }
    });
  });
  res.send(response);
});

app.get("/getCompanyPeopleTargetSearch", async (req, res) => {
  let domain = req.body.domain;
  axios
    .post("https://api.apollo.io/v1/mixed_people/search", {
      api_key: "kErYfFUREsW4jZtC6X9JQg",
      q_organization_domains: domain,
      person_titles: [
        "hr",
        "human resources",
        "Talent Acquisition",
        "Talent Acquisition Manager",
      ],
    })
    .then((response) => {
      console.log("response");
      res.send(response.data.people);
    })
    .catch((err) => {
      console.log("err", err);
      res.send([]);
    });
});

app.post("/getCompanyPeople", authenticateToken, (req, res) => {
  let domain = req.body.domain;
  axios
    .post("https://api.apollo.io/v1/mixed_people/search", {
      api_key: "kErYfFUREsW4jZtC6X9JQg",
      q_organization_domains: domain,
      person_titles: [
        "hr",
        "human resources",
        "Talent Acquisition",
        "Talent Acquisition Manager",
      ],
    })
    .then((response) => {
      mixpanel.track("getcontracts", {
        distinct_id: req.user.email,
      });
      res.send(response.data.people);
    })
    .catch((err) => {
      console.log("err", err);
      res.send([]);
    });
});

//returns array of values if present else empty array
app.post("/getsessionbydate", authenticateToken, (req, res) => {
  // const email = "hardikrawat5061995@gmail.com";
  const docRef = db
    .collection("users")
    .doc(req.user.email)
    .collection("session");
  let startdate = new Date(req.body.date);
  startdate.setHours(0, 0, 0, 0);
  let enddate = new Date(req.body.date);
  enddate.setHours(23, 59, 59, 999);
  console.log(startdate, enddate);
  let mainRef = docRef
    .where("createdAt", ">=", startdate)
    .where("createdAt", "<=", enddate)
    .orderBy("createdAt");
  mainRef
    .get()
    .then((r) => {
      console.log(r);
      let value = [];
      r.forEach((data) => {
        console.log("r", data.data());
        value.push(data.data());
      });
      res.send(value);
    })
    .catch((error) => {
      console.log(error);
      res.send("error");
    });
});

async function saveDebugSession(email, id, data) {
  const FieldValue = admin.firestore.FieldValue;
  data.createdAt = FieldValue.serverTimestamp();
  const mainRef = db.collection("debugSessions").doc(email);
  try {
    // const result = mainRef.set({ [id]: data }, { merge: true });
    // not saving the debug session
    return "success";
  } catch (err) {
    console.log(err, "err");
    return "error";
  }
}

async function saveDebugReport(email, id, data) {
  const FieldValue = admin.firestore.FieldValue;
  if (
    data &&
    typeof data == "object" &&
    Object.keys(data).length > 0 &&
    email in data
  ) {
    const newdata = data[email];
    const endSession = newdata?.linkedin?.endSession;
    const startSession = newdata?.linkedin?.startSession;
    if (startSession && endSession) {
      newdata.totaltime = -(endSession - startSession) / 1000;
    }
    newdata.createdAt = FieldValue.serverTimestamp();
    const mainRef = db.collection("debugReport").doc(email);
    try {
      console.log("debug report");
      mainRef.set({ [id]: data }, { merge: true });
    } catch (err) {
      console.log(err, "err debug report");
    }
  }
}

const saveRestartSession = (restartSession) => {
  const email = restartSession.email;
  const sessionId = restartSession.sessionId;
  const platformName = restartSession.platformName;
  const s3 = new aws.S3({
    region: "ap-south-1",
    accessKeyId: "AKIAXUEEQ6FOV7SDN674",
    secretAccessKey: "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",
  });
  const s3Params = {
    Bucket: "debugjobs",
    Key: `${email}/${platformName}/${sessionId}.json`,
    Body: JSON.stringify(restartSession),
  };
  return new Promise((resolve, reject) => {
    s3.putObject(s3Params, function (err, result) {
      if (err) {
        reject("some error occured");
      }
      if (result) {
        mixpanel.track("restartSession", {
          distinct_id: email,
          platformName: platformName,
          sessionId: sessionId,
        });
        resolve("success");
      }
    });
  });
};

const getRestartSession = (email, platformName, sessionId) => {
  const s3 = new aws.S3({
    region: "ap-south-1",
    accessKeyId: "AKIAXUEEQ6FOV7SDN674",
    secretAccessKey: "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",
  });
  const s3Params = {
    Bucket: "debugjobs",
    Key: `${email}/${platformName}/${sessionId}.json`,
  };
  return new Promise((resolve, reject) => {
    s3.getObject(s3Params, function (err, result) {
      if (err) reject("error");
      if (result) resolve(result);
    });
  });
};

app.get(
  "/getRestartSession/:email/:platformName/:sessionId",
  async (req, res) => {
    const email = req.params["email"];
    const platformName = req.params["platformName"];
    const sessionId = req.params["sessionId"];
    if (email && platformName && sessionId) {
      try {
        let result = await getRestartSession(email, platformName, sessionId);
        if (result?.Body) {
          result = JSON.parse(result.Body.toString("utf-8"));
          res.send(result);
        } else {
          res.send({});
        }
      } catch (error) {
        res.send({});
      }
    } else {
      res.send({});
    }
  }
);

app.post("/saveDebugSession", authenticateToken, async (req, res) => {
  // const email = req.user.email;
  // const sessionId = req.body.sessionId;
  // const sessionData = req.body.sessionData;
  // const datamainlinkedin = req.body?.datamainlinkedin;
  // const restartSession = req.body?.restartSession;
  // try {
  //   const response = await saveDebugSession(email, sessionId, sessionData);
  //   await saveDebugReport(email, sessionId, datamainlinkedin);
  //   if (restartSession) {
  //     const result = await saveRestartSession(restartSession);
  //     console.log("result", result);
  //   } else {
  //     console.log("not present");
  //   }
  //   return res.send(response);
  // } catch (error) {
  //   console.log(error);
  //   return res.send({ error: { message: error.message } });
  // }
  res.send("success");
});
// app.get("/ok", (req, res) => {
//   const docRef = db.collection("feedback");
//   var start = new Date();
//   start.setHours(0, 0, 0, 0);
//   const FieldValue = admin.firestore.FieldValue;
//   var end = new Date();
//   end.setHours(23, 59, 59, 999);
//   console.log(start, end);
//   const event = new Date();
//   //const expirationDate = admin.firestore.Timestamp.fromDate(event);
//   const future = new Date().setDate(event.getDate() - 10);
//   // console.log('future',new Date(future))
//   // console.log(expirationDate)
//   //   docRef.add({timestamp:admin.firestore.Timestamp.fromDate(new Date(future)),yo:'hardik'}).then((r) => {
//   //       console.log('ok')
//   //   }).catch((error) =>{
//   //       console.log(error)
//   //   })

//   let a = docRef.where("timestamp", ">=", start).where("timestamp", "<=", end);

//   a.get()
//     .then((r) => {
//       console.log(r);
//       let value = [];
//       r.forEach((data) => {
//         console.log("r", data.data());
//         value.push(data.data());
//       });
//       res.send(value);
//     })
//     .catch((error) => {
//       res.send(error);
//     });
//   //console console.log(a)
// });
app.get("/getAllUserFeedbacks", authenticateToken, (req, res) => {
  console.log(req.user);
  if (
    req.user.email === "prakhargupta.2106@gmail.com" ||
    req.user.email === "vivekiitjcse@gmail.com"
  ) {
    const mainRef = db.collection("feedbacks");
    mainRef
      .get()
      .then(function (docRef) {
        console.log("feedback", JSON.stringify(docRef.docs));
        const r = docRef.docs;
        const tempDoc = r.map((doc) => {
          console.log("data", doc);
          return { id: doc.id, ...doc.data() };
        });
        res.send(tempDoc);
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
        res.status(400).json({ error: "Something went wrong" });
      });
  } else {
    res.status(403).send({ error: "not authorised" });
  }
});

app.get("/addUserToLazyapplyX", async (req, res) => {
  const email = req.query["email"];
  const code = req.query["code"];
  if (code && code === process.env.ADDUSERCODE) {
    const mainRef = db.collection("betalistusers");
    await mainRef.doc(email).set(
      {
        grantPermission: 1,
      },
      { merge: true }
    );
    res.send({
      response:
        "Successfully Granted Premission, should add in google cloud test list also",
    });
  } else {
    res.send({ response: "wrong code" });
  }
});

app.get("/betaListLazyapplyX", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const mainRef = db.collection("betalistusers");
  const documentReferences = await mainRef.listDocuments();
  const documentIds = documentReferences.map((it) => it.id);
  console.log("documentIds", documentIds);
  if (documentIds.includes(email)) {
    res.send({
      accessGranted: 1,
    });
  } else {
    res.send({
      accessGranted: 0,
    });
  }
});

const getCSV = async (keys) => {
  const s3 = new aws.S3({
    region: "ap-south-1",
    accessKeyId: "AKIAXUEEQ6FOV7SDN674",
    secretAccessKey: "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",
  });

  const csvPromises = [];

  keys.forEach((key) => {
    const s3Params = {
      Bucket: "emailcsvsendy",
      Key: key + ".csv",
    };

    const csvPromise = s3.getObject(s3Params).promise();
    csvPromises.push(csvPromise);
  });

  try {
    const csvResponses = await Promise.all(csvPromises);

    const mergedCSV = csvResponses.reduce((merged, response, index) => {
      const key = keys[index];
      const csvContent = response.Body.toString("utf-8");
      const csvRows = csvContent.split("\n");
      return merged.concat(csvRows);
    }, []);

    const uniqueEmails = new Set();
    const deduplicatedCSV = mergedCSV.filter((row) => {
      const email = row.split(",")[1].replace(/"/g, "").trim();
      if (!uniqueEmails.has(email)) {
        uniqueEmails.add(email);
        return true;
      }
      return false;
    });

    const mergedCSVContent = deduplicatedCSV.join("\n");

    const outputDir = "./allcsv/";

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const csvContent = csvResponses[i].Body;
      const csvFilename = `${outputDir}${key}.csv`;
      await writeFile(csvFilename, csvContent);
      console.log(`Downloaded CSV file: ${csvFilename}`);
    }

    const mergedCSVFilename = `${outputDir}merged.csv`;
    await writeFile(mergedCSVFilename, mergedCSVContent);
    console.log(
      `Merged and deduplicated CSV file created: ${mergedCSVFilename}`
    );
  } catch (error) {
    console.error("Error downloading and processing CSV files:", error);
  }
};

// const uuids = require("./uuids");
// console.log("keys", uuids);
// const downloadAllCsv = async () => {
//   const keys = uuids;
//   await getCSV(keys);
// };

app.get("/appliedLinks/:email", authenticateToken, (req, res) => {
  // const email = req.params["email"];
  const email = req.user.email;
  const platform = req.query["platform"];
  let mainRef;
  if (platform) {
    mainRef = db
      .collection("users")
      .doc(email)
      .collection("session")
      .where("platformName", "==", platform);
  } else {
    mainRef = db.collection("users").doc(email).collection("session");
  }
  mainRef.get().then(function (docRef) {
    const data = [];
    const sessionLinksBefore = [];
    let length = 0;
    docRef.forEach((doc) => {
      length += doc.data().count;
      if ("sessionLinksBefore" in doc.data()) {
        sessionLinksBefore.push(...doc.data().sessionLinksBefore);
      }
      data.push(...doc.data().sessionLinks);
    });
    console.log("data call", {
      totaljobs: length,
      totalsessions: docRef.size,
      sessionLinks: data.length,
      sessionLinksBefore: sessionLinksBefore.length,
    });
    res.send({
      totaljobs: length,
      totalsessions: docRef.size,
      sessionLinks: data,
      sessionLinksBefore: sessionLinksBefore,
    });
  });
});

const coverwords = [
  "1",
  "test",
  "fgdfgf",
  "bob",
  "k",
  "front",
  "pornhub",
  "onlyfans",
  "xxx",
  "fuck",
  "dick",
  "4",
  "1452",
  "terrorist",
  "suicide",
  "killer",
  ".",
  "ty",
  "hh",
  "jjdj",
  "z",
  "lhlhlh",
  "2",
];

const nowIncludedInCover = (title, data, maindata) => {
  const positionName = encodeURIComponent(title.toLowerCase());
  if (!coverwords.includes(positionName) && positionName != "") {
    if (!(positionName in maindata)) {
      maindata[positionName] = [];
      maindata[positionName].push({ ...data, originalTitle: title });
    } else {
      maindata[positionName].push({ ...data, originalTitle: title });
    }
  }
  return maindata;
};

const nowIncludedInCover1 = (title, data, maindata) => {
  const positionName = encodeURIComponent(title);
  if (!coverwords.includes(positionName) && positionName != "") {
    if (!(positionName in maindata)) {
      maindata[positionName] = [];
      maindata[positionName].push({ ...data, originalTitle: title });
    } else {
      maindata[positionName].push({ ...data, originalTitle: title });
    }
  }
  return maindata;
};

const nowIncludedInCoverForPosition = (title, data, maindata) => {
  const positionName = title.toLowerCase().trim();
  if (!coverwords.includes(positionName) && positionName != "") {
    if (!(positionName in maindata)) {
      maindata[positionName] = [];
      maindata[positionName].push({ ...data, originalTitle: title });
    } else {
      maindata[positionName].push({ ...data, originalTitle: title });
    }
  }
  return maindata;
};

const groupTogetherPositionAndCompany = (data) => {
  let idsArray = [];
  Object.keys(data).forEach((key) => {
    let x = {};
    const main = data[key];
    main.forEach((obj) => {
      x = nowIncludedInCover(obj.nameofcompany, obj, x);
    });
    Object.keys(x).forEach((companynamekey) => {
      const companyDataArray = x[companynamekey];
      if (companyDataArray.length > 0) {
        const coverData = companyDataArray[0];
        let id = `${encodeURIComponent(
          key
        )}-cover-letters-for-${encodeURIComponent(coverData.nameofcompany)}-0`;
        idsArray.push({
          params: {
            id,
          },
        });
      }
      // companyDataArray.forEach((coverData, index) => {
      //   let id = `${encodeURIComponent(
      //     key
      //   )}-cover-letters-for-${encodeURIComponent(
      //     coverData.nameofcompany
      //   )}-${index}`;
      //   idsArray.push({
      //     params: {
      //       id,
      //     },
      //   });
      // });
    });
  });
  return idsArray;
};

const groupTogether = (data) => {
  let maindata = {};
  data.forEach((main) => {
    maindata = nowIncludedInCoverForPosition(
      main.coverletterdata.position,
      main.coverletterdata,
      maindata
    );
  });
  return maindata;
};

// app.get("/getlinkedin", (req, res) => {
//   mainRef = db.collection("debugReport");
//   let linkedin = {};
//   mainRef.get().then(function (docRef) {
//     console.log(docRef.docs.length);
//     docRef.docs.forEach((data) => {
//       const obj = data.data();
//       const email = data.id;
//       Object.keys(obj).forEach((key) => {
//         console.log("key", key, obj[key]);
//         const objdata = obj[key][email];
//         if ("indeed" in objdata) {
//           linkedin = { ...linkedin, ...objdata["indeed"] };
//         }
//       });
//     });
//     fs.writeFileSync(
//       "indeedQuestions.js",
//       JSON.stringify(linkedin),
//       (err, data) => {
//         if (err) {
//           res.send({ message: "err" });
//         }
//         res.send({ message: "success" });
//       }
//     );
//   });
// });

const groupTogetherWithCompany = (data, queryText) => {
  let maindata = {};
  data = data
    .filter((main) => {
      if (
        main.coverletterdata.position
          .toLowerCase()
          .includes(queryText.toLowerCase())
      ) {
        return true;
      } else {
        return false;
      }
    })
    .map((filteredData) => {
      return filteredData;
    });
  data.forEach((main) => {
    maindata = nowIncludedInCover1(
      main.coverletterdata.nameofcompany,
      main.coverletterdata,
      maindata
    );
  });
  return maindata;
};

app.get("/viewcover", async (req, res) => {
  const title = req.query["title"];
  console.log("v1", title);
  let maintitle = title.split("-cover-letters-for-")[0].trim();

  const endstring = title.split("-cover-letters-for-")[1];
  const mainnamequery = endstring.substr(
    0,
    endstring.lastIndexOf("-", endstring.length - 1)
  );
  let mainname = title
    .split("-cover-letters-for-")[1]
    ?.replace(/-/g, " ")
    .trim();
  let mainRef = db.collection("coverletters");
  const index = parseInt(mainname?.substring(mainname.lastIndexOf(" ")).trim());
  mainname = mainname?.substring(0, mainname.lastIndexOf(" "));
  // maintitle = maintitle?.replace(/-/g, " ").trim();
  console.log("mainname", mainnamequery, index, mainname, maintitle);
  if (mainname && mainname != "") {
    mainRef = mainRef.where(
      "coverletterdata.nameofcompany",
      "==",
      mainnamequery
    );
    const finaldata = await new Promise((resolve, reject) => {
      mainRef
        .get()
        .then((docRef) => {
          const data = docRef.docs.map((doc) => {
            return doc.data();
          });
          let finald = [];
          data.forEach((obj) => {
            if (
              obj.coverletterdata.position
                .toLowerCase()
                .includes(maintitle.toLowerCase())
            ) {
              finald.push(obj);
            }
          });
          resolve({ maindata: finald[index] });
        })
        .catch((err) => {
          resolve({});
        });
    });
    res.send({ data: finaldata });
  } else {
    res.send({ data: {} });
  }
});

app.get("/getCoverLetterIds", async (req, res) => {
  let mainRef = db.collection("coverletters");
  const finaldata = await new Promise((resolve, reject) => {
    mainRef
      .get()
      .then((docRef) => {
        const data = docRef.docs.map((doc) => {
          return doc.data();
        });
        const data1 = groupTogether(data);
        resolve(groupTogetherPositionAndCompany(data1));
      })
      .catch((err) => {
        resolve({ data: [] });
      });
  });
  res.send({ data: finaldata });
});

const planUpgradeV1 = (email) => {
  let mainRef = db.collection("users").doc(email);
  let mainRef1 = db.collection("v2collection").doc("resumemeta");
  let mainRef2 = db.collection("v2collection").doc("resumes");
  let mainRef3 = db.collection("users").doc(email).collection("session");
  let mainRef4 = db.collection("v2collection").doc("sessions");
  new Promise((resolve, reject) => {
    mainRef
      .get()
      .then(async (docRef) => {
        const data = docRef.data();
        if ("resume" in data) {
          const resume = docRef.data().resume;
          const uuid = uuidv4();
          const id = email + "v2Id";
          let obj = {
            resumename: "first_resume",
            resumeId: uuid,
          };
          if ("skills" in data) {
            obj.skills = data.skills;
          }
          if ("additionalresumevalidation" in data) {
            obj.additionalresumevalidation = data.additionalresumevalidation;
          }
          if ("resumevalidation" in data) {
            obj.resumevalidation = data.resumevalidation;
          }
          try {
            await mainRef1.collection(id).doc(uuid).set({
              createdBy: email,
              resumeId: uuid,
              resumename: "first_resume",
            });
          } catch (err) {
            console.log("err", err);
          }
          try {
            await mainRef2
              .collection(id)
              .doc(uuid)
              .set({
                resume: resume,
                ...obj,
              });
          } catch (err) {
            console.log("err", err);
          }
          try {
            const data = await mainRef3.get();
            if (data && data.size > 0) {
              let mainsession = {};
              data.docs.map((doc) => {
                mainsession[doc.id] = {
                  ...doc.data(),
                  email,
                  resumeId: uuid,
                  resumename: "first_resume",
                };
              });
              const keys = Object.keys(mainsession);
              for (let index = 0; index < keys.length; index++) {
                const mainkey = keys[index];
                const maindata = mainsession[mainkey];
                try {
                  await mainRef4
                    .collection(id)
                    .doc(mainkey)
                    .set(maindata, { merge: true });
                } catch (err) {
                  console.log("err", err);
                }
              }
            }
          } catch (err) {
            console.log("err", err);
          }
        }
        resolve("success");
      })
      .catch((err) => {
        console.log("err", err);
        resolve("error");
      });
  });
};

// app.get("/deletecover", async (req, res) => {
//   var cover_query = db
//     .collection("coverletters")
//     .where("coverletterdata.myname", "==", "john");
//     console.log('ok')
//   cover_query.get().then(function (querySnapshot) {
//     console.log('ok1',querySnapshot)
//     querySnapshot.forEach(function (doc) {
//       console.log(doc.data().coverletterdata);
//       // doc.ref.delete();
//     });
//   });
// });

app.get("/getCoverLetters", async (req, res) => {
  const title = req.query["title"];
  let queryText = "";
  let mainRef = db.collection("coverletters");
  console.log("title", title);
  if (title && title != "maincoverletters") {
    queryText = title.replace("-cover-letters", "").trim();
    const finaldata = await new Promise((resolve, reject) => {
      mainRef
        .get()
        .then((docRef) => {
          const data = docRef.docs.map((doc) => {
            return doc.data();
          });
          resolve(groupTogetherWithCompany(data, queryText));
        })
        .catch((err) => {
          resolve({});
        });
    });
    res.send({ data: finaldata });
  } else {
    const finaldata = await new Promise((resolve, reject) => {
      mainRef
        .get()
        .then((docRef) => {
          const data = docRef.docs.map((doc) => {
            return doc.data();
          });

          resolve(groupTogether(data));
        })
        .catch((err) => {
          resolve({});
        });
    });
    res.send({ data: finaldata });
  }
});

app.get("/appliedLinksAnalytics", authenticateToken, (req, res) => {
  const email = req.user.email;
  const platform = req.query["platform"];
  let mainRef;
  if (platform) {
    mainRef = db
      .collection("users")
      .doc(email)
      .collection("session")
      .where("platformName", "==", platform);
  } else {
    mainRef = db.collection("users").doc(email).collection("session");
  }
  mainRef.get().then(function (docRef) {
    let length = 0;
    docRef.forEach((doc) => {
      length += doc.data().count;
    });
    res.send({
      totaljobs: length,
      totalsessions: docRef.size,
      sessionLinks: length,
    });
  });
});

app.get("/getAllUserDetails", authenticateToken, (req, res) => {
  console.log(req.user);
  if (
    req.user.email === "prakhargupta.2106@gmail.com" ||
    req.user.email === "vivekiitjcse@gmail.com"
  ) {
    const mainRef = db.collection("users");
    // const mainRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");
    mainRef
      .get()
      .then(function (docRef) {
        console.log(docRef);
        const r = docRef.docs;

        const tempDoc = r.map((doc) => {
          return { id: doc.id, ...doc.data() };
        });
        res.send(tempDoc);
        //   console.log("Document written with ID: ", docRef.id);
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
        res.status(400).json({ error: "Something went wrong" });
      });
  } else {
    res.status(403).send({ error: "not authorised" });
  }
});
app.post("/savejoblinksziprecruiterUpdated", authenticateToken, (req, res) => {
  // const docRef = db.collection("users").doc(req.user.email);
  // console.log("total links--------->", req.body.ziprecruiterTotalLinks);
  // //const docRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");
  // const ziprecruiterTotalLinks = req.body.ziprecruiterTotalLinks;
  // docRef
  //   .get()
  //   .then((doc) => {
  //     if (doc.exists) {
  //       console.log(doc.data());
  //       let jobLinks = [];
  //       if ("ziprecruiterJobApplicationLinks" in doc.data())
  //         jobLinks = doc.data().ziprecruiterJobApplicationLinks;

  //       const map = new Map();
  //       const array2 = jobLinks;
  //       const array1 = ziprecruiterTotalLinks;
  //       array1.forEach((item) => {
  //         let mainhref = item.id;
  //         map.set(mainhref, item);
  //       });
  //       array2.forEach((item) => {
  //         let mainhref = item.id;
  //         map.set(mainhref, { ...map.get(mainhref), ...item });
  //       });
  //       const mergedArr = Array.from(map.values());
  //       const combinedJobLinks = mergedArr;
  //       console.log("mergedarray", combinedJobLinks.length);
  //       console.log(
  //         combinedJobLinks.length,
  //         jobLinks.length,
  //         ziprecruiterTotalLinks.length,
  //         "mergedArray1"
  //       );
  //       docRef
  //         .update({
  //           ziprecruiterJobApplicationLinks: [...combinedJobLinks],
  //         })
  //         .then(() => {
  //           console.log("Document successfully written!");
  //           res.send({
  //             ziprecruiterTotalLinks: [...combinedJobLinks],
  //           });
  //         })
  //         .catch((error) => {
  //           console.error("Error writing document: ", error);
  //           res.status(400).json({ error: "Something went wrong" });
  //         });
  //     } else {
  //       // doc.data() will be undefined in this case
  //       console.log("No such document!");
  //       res.send("no data");
  //     }
  //   })
  //   .catch((error) => {
  //     res.status(400).json({ error: "Something went wrong" });
  //     console.log("Error getting document:", error);
  //   });
  res.send({
    ziprecruiterTotalLinks: [],
  });
});
app.post("/savejoblinkslinkedinUpdated", authenticateToken, (req, res) => {
  // const docRef = db.collection("users").doc(req.user.email);
  // console.log("total links--------->", req.body.linkedinTotalLinks);
  // //const docRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");
  // const linkedinTotalLinks = req.body.linkedinTotalLinks;
  // docRef
  //   .get()
  //   .then((doc) => {
  //     if (doc.exists) {
  //       console.log(doc.data());
  //       let jobLinks = [];
  //       if ("linkedinJobApplicationLinks" in doc.data())
  //         jobLinks = doc.data().linkedinJobApplicationLinks;

  //       const map = new Map();
  //       const array2 = jobLinks;
  //       const array1 = linkedinTotalLinks;
  //       array1.forEach((item) => {
  //         let mainhref = item.href;
  //         mainhref = mainhref.replace(
  //           "https://www.linkedin.com/jobs/view/",
  //           ""
  //         );
  //         mainhref = mainhref.substring(0, mainhref.indexOf("/"));
  //         map.set(mainhref, item);
  //       });
  //       array2.forEach((item) => {
  //         if (typeof item === "object" && item != null) {
  //           let mainhref = item.href;
  //           mainhref = mainhref.replace(
  //             "https://www.linkedin.com/jobs/view/",
  //             ""
  //           );
  //           mainhref = mainhref.substring(0, mainhref.indexOf("/"));
  //           map.set(mainhref, { ...map.get(mainhref), ...item });
  //         } else {
  //           let mainhref = item;
  //           mainhref = mainhref.replace(
  //             "https://www.linkedin.com/jobs/view/",
  //             ""
  //           );
  //           mainhref = mainhref.substring(0, mainhref.indexOf("/"));
  //           if (map.get(mainhref)) {
  //             map.set(mainhref, { ...map.get(mainhref), href: item });
  //           } else {
  //             map.set(mainhref, item);
  //           }
  //         }
  //       });
  //       const mergedArr = Array.from(map.values());
  //       const combinedJobLinks = mergedArr;
  //       console.log("mergedarray", combinedJobLinks.length);
  //       console.log(
  //         combinedJobLinks.length,
  //         jobLinks.length,
  //         linkedinTotalLinks.length,
  //         "mergedArray1"
  //       );
  //       docRef
  //         .update({
  //           linkedinJobApplicationLinks: [...combinedJobLinks],
  //         })
  //         .then(() => {
  //           console.log("Document successfully written!");
  //           res.send({
  //             linkedinTotalLinks: [...combinedJobLinks],
  //           });
  //         })
  //         .catch((error) => {
  //           console.error("Error writing document: ", error);
  //           res.status(400).json({ error: "Something went wrong" });
  //         });
  //     } else {
  //       // doc.data() will be undefined in this case
  //       console.log("No such document!");
  //       res.send("no data");
  //     }
  //   })
  //   .catch((error) => {
  //     res.status(400).json({ error: "Something went wrong" });
  //     console.log("Error getting document:", error);
  //   });

  res.send({
    linkedinTotalLinks: [],
  });
});

app.post("/savejoblinkslinkedin", authenticateToken, (req, res) => {
  // const docRef = db.collection("users").doc(req.user.email);
  // console.log("total links--------->", req.body.linkedinTotalLinks);
  // //const docRef = db.collection("users").doc("V2LJFnWTOdND6KV4yxXE");
  // const linkedinTotalLinks = req.body.linkedinTotalLinks;
  // docRef
  //   .get()
  //   .then((doc) => {
  //     if (doc.exists) {
  //       console.log(doc.data());
  //       let jobLinks = [];
  //       if ("linkedinJobApplicationLinks" in doc.data())
  //         jobLinks = doc.data().linkedinJobApplicationLinks;
  //       const combinedJobLinks = [...linkedinTotalLinks, ...jobLinks];
  //       console.log(
  //         [...new Set(combinedJobLinks)].length,
  //         jobLinks.length,
  //         linkedinTotalLinks.length
  //       );
  //       console.log(combinedJobLinks);
  //       console.log("doc exist, update the links in firestore");
  //       docRef
  //         .update({
  //           linkedinJobApplicationLinks: [...new Set(combinedJobLinks)],
  //         })
  //         .then(() => {
  //           console.log("Document successfully written!");
  //           res.send({
  //             linkedinTotalLinks: [...new Set(combinedJobLinks)],
  //           });
  //         })
  //         .catch((error) => {
  //           console.error("Error writing document: ", error);
  //           res.status(400).json({ error: "Something went wrong" });
  //         });
  //     } else {
  //       // doc.data() will be undefined in this case
  //       console.log("No such document!");
  //       res.send("no data");
  //     }
  //   })
  //   .catch((error) => {
  //     res.status(400).json({ error: "Something went wrong" });
  //     console.log("Error getting document:", error);
  //   });

  res.send({
    linkedinTotalLinks: [],
  });
});

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(
  "715818145189-dpnfl7psstmj7td448orqje5th7j4ocb.apps.googleusercontent.com"
);
const client2 = new OAuth2Client(
  "715818145189-7geg3j3td9u21nc9qe8eujb2l4dcbt88.apps.googleusercontent.com"
);

app.get("/targetSearchData", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const response = await db.collection("targetSearchUsers").doc(email).get();
  if (response.exists) {
    console.log("exist");
    const data = response.data();
    res.send({
      ...data,
    });
  } else {
    console.log(" does not exist");
    res.send({
      planStarted: 0,
      stepNo: 0,
    });
  }
});

app.get("/getChromeVersion", async (req, res) => {
  try {
    const data = await dbFree
      .collection("extensionDetails")
      .doc("lazyapply")
      .get();
    res.send({
      found: true,
      version: data.data().chromeVersion,
    });
  } catch (err) {
    res.send({
      found: false,
    });
  }
});

app.post("/saveTokenAndConnectEmail", authenticateToken, async (req, res) => {
  const email = req.user.email;
  const code = req.body.code;
  // Exchange the authorization code for an access token.
  let token = {};
  let message = "";
  console.log("email", email);
  try {
    // const clientMain = new OAuth2Client(
    //   "715818145189-7geg3j3td9u21nc9qe8eujb2l4dcbt88.apps.googleusercontent.com",
    //   "-CUvXGQs4RlB9JXkM_CMeByt",
    //   "https://app.lazyapply.com"
    // );
    const clientMain = new OAuth2Client(
      "118263103120-1ourv3amn189uosq88jfd5illheaagu9.apps.googleusercontent.com",
      "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",
      "https://app.lazyapply.com/dashboard/lazyapply-x"
    );

    const { tokens } = await clientMain.getToken(code);
    token = tokens;
    console.log("token", token);
    const scopes = token.scope.split(" ");
    console.log("scopes", scopes);
    let scopePresent = false;
    if (scopes.includes("https://www.googleapis.com/auth/gmail.send")) {
      scopePresent = true;
    }
    console.log("scopePresent", scopePresent);
    if (scopePresent) {
      await db.collection("targetSearchUsers").doc(email).set(
        {
          refresh_token: token.refresh_token,
          nextPage: 1,
          planStarted: 0,
          stepNo: 1,
          email: email,
        },
        { merge: true }
      );
      console.log("successfully saved");
      message = "Successfully Linked";
    } else {
      message = "Access not given to Lazyapply";
    }
  } catch (err) {
    console.log("err", err);
    message = "Some Error Occured";
  }
  res.send({
    message,
  });
});

// app.get("/getauth", (req, res) => {
//   const authorizationUrl = client2.generateAuthUrl({
//     // 'online' (default) or 'offline' (gets refresh_token)
//     access_type: "offline",
//     /** Pass in the scopes array defined above.
//      * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
//     scope: "https://mail.google.com/",
//     // Enable incremental authorization. Recommended as a best practice.
//     include_granted_scopes: true,
//   });
//   res.send({ url: authorizationUrl });
// });

app.post("/api/v1/auth/google", async (req, res) => {
  console.log(req.body.token);
  const { token } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience:
      "715818145189-dpnfl7psstmj7td448orqje5th7j4ocb.apps.googleusercontent.com",
  });

  console.log(ticket);
  console.log(ticket.getPayload());
  const { name, email, picture } = ticket.getPayload();
  const mainRef = db.collection("users").doc(email);
  const user = { name, email, picture };

  const response1 = await createContact(user.name, user.email);
  let id = response1?.contact?.id;
  if (id) {
    console.log("freshworkId", id);
  } else {
    id = "";
    console.log("some error in getting freshworkId");
  }
  mainRef
    .get()
    .then(async (doc) => {
      if (doc.exists) {
        const userInfo = doc.data();
        console.log("doc exist");
        console.log(userInfo);
        const jwtToken = generateAccessToken(user.name, user.email);
        res.status(201);
        res.json({ token: jwtToken, user: user });
      } else {
        console.log("doc didnot exist, create one");
        let planName = "free";
        let monthlyLimit = 80;
        let dailyLimit = 80;
        let startDate = new Date();
        let endDate = new Date().setDate(startDate.getDate() + 5);
        let planDetails = {
          endDate: new Date(endDate),
          startDate,
          planName,
          monthlyLimit,
          dailyLimit,
          planStarted: 0,
        };
        mixpanel.track("account created", {
          distinct_id: user.email,
        });

        mainRef
          .set({
            id: id,
            name: user.name,
            picture: user.picture,
            email: user.email,
            planDetails: planDetails,
          })
          .then(() => {
            const jwtToken = generateAccessToken(user.name, user.email);
            res.status(201);
            res.json({ token: jwtToken, user: user });
          })
          .catch((err) => {
            res.status(400).json({ error: "Something went wrong" });
          });
      }
    })
    .catch((error) => {
      res.status(400).json({ error: "Something went wrong" });
    });
});

// app.post("/testing", async (req, res) => {
//   const { token: code } = req.body;
//   console.log("code", code);
//   try {
//     const { tokens } = await client2.getToken(code);
//     console.log("tokens", tokens);
//   } catch (err) {
//     console.log("err", err);
//   }
// });

app.post("/api/v0/auth/google", async (req, res) => {
  console.log(req.body.token);
  const { token } = req.body;
  const ticket = await client2.verifyIdToken({
    idToken: token,
    audience:
      "715818145189-7geg3j3td9u21nc9qe8eujb2l4dcbt88.apps.googleusercontent.com",
  });

  console.log(ticket);
  console.log(ticket.getPayload());
  const { name, email, picture } = ticket.getPayload();
  const mainRef = db.collection("users").doc(email);
  const user = { name, email, picture };
  const fpr = req.body?.fpr;
  let id = "";
  mainRef
    .get()
    .then(async (doc) => {
      if (doc.exists) {
        const userInfo = doc.data();
        console.log("doc exist");
        console.log(userInfo);
        const jwtToken = generateAccessToken(user.name, user.email);
        res.status(201);
        res.json({ token: jwtToken, user: user });
      } else {
        console.log("doc didnot exist, create one");
        let planName = "free";
        let monthlyLimit = 80;
        let dailyLimit = 80;
        let startDate = new Date();
        let endDate = new Date().setDate(startDate.getDate() + 5);
        let planDetails = {
          endDate: new Date(endDate),
          startDate,
          planName,
          monthlyLimit,
          dailyLimit,
          planStarted: 0,
        };
        if (fpr && fpr != "") {
          await signUpFpr(fpr, user.email);
        }
        mixpanel.track("account created", {
          distinct_id: user.email,
        });

        mainRef
          .set({
            id: id,
            name: user.name,
            picture: user.picture,
            email: user.email,
            planDetails: planDetails,
          })
          .then(() => {
            const jwtToken = generateAccessToken(user.name, user.email);

            res.status(201);
            res.json({ token: jwtToken, user: user });
          })
          .catch((err) => {
            res.status(400).json({ error: "Something went wrong" });
          });
      }
    })
    .catch((error) => {
      res.status(400).json({ error: "Something went wrong" });
    });
});

async function findContactId(email) {
  try {
    const r = await axios.post(
      "https://lazyapply.myfreshworks.com/crm/sales/api/filtered_search/contact",
      {
        filter_rule: [
          { attribute: "contact_email.email", operator: "is_in", value: email },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token token=jAxeCIIN6Y3G2Kuoz9_fyg",
        },
      }
    );
    return r.data.contacts[0].id;
  } catch (err) {
    console.log("Error in finding contact");
  }
}

async function updateContact(id, number) {
  try {
    const r = await axios.put(
      `https://lazyapply.myfreshworks.com/crm/sales/api/contacts/${id}`,
      {
        contact: {
          mobile_number: number,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token token=jAxeCIIN6Y3G2Kuoz9_fyg",
        },
      }
    );
    return "success";
  } catch (err) {
    console.log("error", err);
  }
}

async function createContact(name, email) {
  console.log(name, email);
  let date = new Date().toLocaleDateString("en-GB");
  let o = {
    contact: {
      first_name: name,
      emails: email,
      custom_field: {
        cf_onboarding_date: date,
      },
    },
  };
  console.log(o);
  try {
    const r = await axios.post(
      "https://lazyapply.myfreshworks.com/crm/sales/api/contacts",
      {
        contact: {
          first_name: name,
          emails: email,
          custom_field: {
            cf_onboarding_date: date,
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token token=jAxeCIIN6Y3G2Kuoz9_fyg",
        },
      }
    );
    console.log(r.data);
    return r.data;
  } catch (err) {
    console.log("error", err);
  }
}

async function getCompanyDetails(name) {
  const arrayOfToken = [
    "sk_1d125e99aff02e07d95fec7293de570d",
    "sk_94e9e1b4ae42c210dba765ef679c5cad",
    "sk_9c2707d01e61c791459136c1d89d64ce",
  ];
  const index = Math.floor(Math.random() * 3);
  try {
    const r = await axios.get(
      `https://company.clearbit.com/v1/domains/find?name=${name}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${arrayOfToken[index]}`,
        },
      }
    );
    console.log(r.data);
    return r.data;
  } catch (err) {
    return {};
  }
}

app.get("/companyDetails/:name", authenticateToken, async (req, res) => {
  let name = req.params.name;
  const mainname = encodeURI(name.split("-").join(" "));
  const names = name.split("-")[0];
  const response1 = await getCompanyDetails(names);
  const response2 = await getCompanyDetails(mainname);
  let domains = [];
  if (Object.keys(response1).length > 0) {
    Object.keys(response1).forEach((e) => {
      if ("domain" in response1) domains.push(response1.domain);
    });
  }
  if (Object.keys(response2).length > 0) {
    Object.keys(response2).forEach((e) => {
      if ("domain" in response2) domains.push(response2.domain);
    });
  }
  domains = [...new Set(domains)];
  res.send(domains);
});

async function getEmailFromApollo({
  firstName,
  lastName,
  linkedinUrl,
  name,
  organization_name,
}) {
  const arrayOfToken = [
    "z86yeSuP2rUgCQ9atoa4ow",
    "dsHtPfaHNPRGPyu95yg5Qg",
    "Z9atzJQxE7PWo_Iu2JVEEQ",
    "vEDA1q3yUnts5zxtCvtYOA",
    "kErYfFUREsW4jZtC6X9JQg",
  ];
  const index = Math.floor(Math.random() * 5);
  try {
    const r = await axios.post(
      `https://api.apollo.io/v1/people/match`,
      {
        api_key: arrayOfToken[index],
        first_name: firstName,
        last_name: lastName,
        linkedin_url: linkedinUrl,
        name: name,
        organization_name: organization_name,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(r.data, "r from apollo function");
    return r.data;
  } catch (err) {
    console.log(err?.message, "erron in apollo function", err?.code);
    return {};
  }
}

app.post("/emailfromapollo", authenticateToken, async (req, res) => {
  const body = req.body;
  const response = await getEmailFromApollo(body);
  console.log(response, "response from apollo");
  res.send(response);
});

app.post("/saveReference", authenticateToken, (req, res) => {
  const option = req.body.option;
  const mainRef = db.collection("users").doc(req.user.email);
  mainRef
    .set(
      {
        optionReference: option,
      },
      { merge: true }
    )
    .then(() => {
      console.log("success reference updated", email, option);
      res.send("success");
    })
    .catch(() => {
      console.log("reference not updated", email, option);
      res.send("some error occured");
    });
});

app.post("/payment-final", async (req, res) => {
  // do a validation
  const secret = "owCBOdgUEy382oBlqluvnWykXPbFDmZ2";
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");
  console.log("api call", req.body);
  console.log(digest, req.headers["x-razorpay-signature"]);
  console.log("os", os.hostname());
  if (digest === req.headers["x-razorpay-signature"]) {
    console.log("request is legit");
    // process it

    const paymentdetails = req.body.payload.payment.entity;
    const uniqueid = req.body.payload.payment.entity.id;
    if (req.body.event === "payment.captured") {
      console.log("payment captured", paymentdetails);
      let referralcode = "";
      console.log("referral", paymentdetails?.notes?.referral_code);
      if (
        "notes" in paymentdetails &&
        "referral_code" in paymentdetails.notes
      ) {
        referralcode = paymentdetails.notes.referral_code;
      }
      const accountemail = paymentdetails.email;

      console.log(accountemail, "accountemail");
      const price = paymentdetails.amount;

      mixpanel.track("plan purchased v1", {
        distinct_id: accountemail,
        price: price / (70 * 100),
      });
      addmailingfn(accountemail, mailingjson.paidusers);
      let planName = "";
      let monthlyLimit;
      let dailyLimit;

      if (price >= 149900 && price <= 199900) {
        planName = "basic";
        monthlyLimit = 12000;
        dailyLimit = 150;
      } else if (price > 199900 && price <= 249900) {
        planName = "premium";
        monthlyLimit = 22500;
        dailyLimit = 750;
      } else if (price > 249900) {
        planName = "unlimited";
        monthlyLimit = 300000;
        dailyLimit = 100000;
      }
      mixpanel.people.set(accountemail, {
        plan: planName,
        price: price / (70 * 100),
      });
      // if (price > 200000) {
      //   planName = "premium";
      //   monthlyLimit = 120000;
      //   dailyLimit = 150;
      // } else if (price === 138000) {
      //   planName = "standard";
      //   monthlyLimit = 9000;
      //   dailyLimit = 150;
      // } else {
      //   planName = "basic";
      //   monthlyLimit = 2400;
      //   dailyLimit = 150;
      // }

      await saleFpr(uniqueid, accountemail, Number(price / 70), planName);
      const mainRef = db.collection("users").doc(accountemail);
      let startDate = new Date();
      let endDate = new Date().setDate(startDate.getDate() + 365);
      console.log(
        new Date(endDate),
        startDate,
        planName,
        monthlyLimit,
        dailyLimit
      );
      if (referralcode != "") {
        const response = await saveReferral(accountemail, referralcode);
        console.log("response of referral", response);
      } else {
        console.log("referralcode is not present");
      }
      const finalPlanDetails = {
        endDate: new Date(endDate),
        startDate,
        planName,
        monthlyLimit,
        dailyLimit,
        planStarted: 1,
      };
      const idnew = accountemail + "v2Id";
      if (planName == "premium") {
        finalPlanDetails.v2Id = idnew;
        finalPlanDetails.resumeLimit = 5;
        finalPlanDetails.planType = "individual";
        finalPlanDetails.membertype = "admin";
      } else if (planName == "unlimited") {
        finalPlanDetails.v2Id = idnew;
        finalPlanDetails.resumeLimit = 10;
        finalPlanDetails.planType = "individual";
        finalPlanDetails.membertype = "admin";
      }

      mainRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            mainRef
              .update({
                planDetails: finalPlanDetails,
              })
              .then(() => {
                console.log(
                  "success for plan update on email razorpay",
                  accountemail
                );
              })
              .catch((e) =>
                console.log(
                  "firebase plan update error for email razorpay",
                  accountemail
                )
              );
          } else {
            console.log("account didnot exist, razorpay");
          }
        })
        .catch((error) => {
          console.log("error occured razorpay");
        });
    }
  } else {
    // pass it
    console.log("request is not legit");
  }
  res.json({ status: "ok" });
});

app.post("/payment-final-test", async (req, res) => {
  // do a validation
  const secret = "owCBOdgUEy382oBlqluvnWykXPbFDmZ2";
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");
  console.log("api call", req.body);
  console.log(digest, req.headers["x-razorpay-signature"]);
  console.log("os", os.hostname());
  if (digest === req.headers["x-razorpay-signature"]) {
    console.log("request is legit");
    // process it
    const paymentdetails = req.body.payload.payment.entity;

    if (req.body.event === "payment.captured") {
      console.log("payment amount test", paymentdetails.amount);
    }
  } else {
    // pass it
    console.log("request is not legit");
  }
  res.json({ status: "ok" });
});

// For a fully working example, please see:
// https://github.com/paypal-examples/docs-examples/tree/main/standard-integration

const baseURL = {
  sandbox: "https://api-m.sandbox.paypal.com",
  production: "https://api-m.paypal.com",
};

// create a new order
app.post("/create-paypal-order", authenticateToken, async (req, res) => {
  const { title, amount } = req.body;
  const email = req.user.email;
  const order = await createOrder(title, email, "", amount);
  console.log("order", order);
  res.json(order);
});

// capture payment & store order information or fullfill order
app.post("/capture-paypal-order", authenticateToken, async (req, res) => {
  const { orderID } = req.body;
  console.log("orderid", orderID);
  const captureData = await capturePayment(orderID);
  // TODO: store payment information such as the transaction ID
  res.json(captureData);
});

// create a new order for website
app.post("/create-paypal-order-website", async (req, res) => {
  const { title, custom_id } = req.body;
  const order = await createOrder(title, "", custom_id, undefined);
  res.json(order);
});

// capture payment & store order information or fullfill order for website
app.post("/capture-paypal-order-website", async (req, res) => {
  const { orderID } = req.body;
  console.log("orderid", orderID);
  const captureData = await capturePayment(orderID);
  // TODO: store payment information such as the transaction ID
  res.json(captureData);
});

async function searchTransactions(orderId) {
  try {
    const apiUrl = `https://api.paypal.com/v2/checkout/orders/${orderId}`;
    const access_token = await generateAccessToken1();

    const response = await fetch(`${apiUrl}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });

    const data = await response.json();
    const email = data?.payer?.email_address || "";
    const name = data?.payer?.name?.given_name || "";
    console.log("email", email);
    return { email, name, data };
  } catch (error) {
    console.error("err", error);
    return { email: "", name: "", data: {} };
  }
}

//////////////////////
// PayPal API helpers
//////////////////////

// use the orders api to create an order

const paypalPurchase = (amount) => {
  return {
    basic: {
      amount: {
        currency_code: "USD",
        value: amount ? amount : "99.00",
      },
      description: "Lazyappy Basic Plan",
    },
    premium: {
      amount: {
        currency_code: "USD",
        value: amount ? amount : "129.00",
      },
      description: "Lazyappy Premium Plan",
    },
    unlimited: {
      amount: {
        currency_code: "USD",
        value: amount ? amount : "259.00",
      },
      description: "Lazyappy Unlimited Plan",
    },
  };
};

app.post("/activatePlanPaypal", verifyOriginHeader, async (req, res) => {
  console.log("req", req.body);
  const details = await searchTransactions(req.body.orderId);
  console.log("details", details);
  const name = details.name;
  const data = details.data;
  const orderId = req.body.orderId;
  if (details.email != "" && data.name && data.name != "RESOURCE_NOT_FOUND") {
    console.log("Not Found");
  } else {
    if (Object.keys(data).length > 0 && data.status === "COMPLETED") {
      const purchase = data?.purchase_units?.[0];
      console.log("purchase", purchase);
      const mainemail = purchase.custom_id;
      const amount = parseFloat(purchase.amount.value);
      console.log("email", mainemail, amount, name);
      mainfn(purchase.amount.value, amount, orderId, mainemail, name);
    }
  }
  res.send({ message: "Updated Successfully" });
});

app.post(
  "/activatePlanPaypalExtension",
  authenticateToken,
  verifyOriginHeader,
  async (req, res) => {
    console.log("req", req.body);
    const details = await searchTransactions(req.body.orderId);
    console.log("details", details);
    const name = details.name;
    const data = details.data;
    const orderId = req.body.orderId;
    if (details.email != "" && data.name && data.name != "RESOURCE_NOT_FOUND") {
      console.log("Not Found");
    } else {
      if (Object.keys(data).length > 0 && data.status === "COMPLETED") {
        const purchase = data?.purchase_units?.[0];
        console.log("purchase", purchase);
        const mainemail = req.user.email;
        const amount = parseFloat(purchase.amount.value);
        console.log("email", mainemail, amount, name);
        mainfn(purchase.amount.value, amount, orderId, mainemail, name);
      }
    }
    res.send({ message: "Updated Successfully" });
  }
);

async function createOrder(title, email, custom_id = "", amount) {
  const objmain1 = paypalPurchase(amount)[title]
  let objmain = {};
  if (email != "") {
    objmain = {
      intent: "CAPTURE",
      payer: {
        email_address: email,
      },
      purchase_units: [objmain1],
    };
  } else {
    objmain1.custom_id = custom_id;
    objmain = {
      intent: "CAPTURE",
      purchase_units: [objmain1],
    };
  }
  const accessToken = await generateAccessToken1();
  const url = `${baseURL.production}/v2/checkout/orders`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(objmain),
  });
  const data = await response.json();
  return data;
}

const mainfn = (number, amount, orderid, email, name) => {
  if (orderid && email != "") {
    console.log("amount", amount);
    console.log("Payment capture completed");
    if (amount == 99) {
      planName = "basic";
      monthlyLimit = 12000;
      dailyLimit = 150;
      mixpanel.people.set(email, {
        plan: "basic",
        price: amount,
      });
    } else if (amount == 129 || amount == 50) {
      planName = "premium";
      monthlyLimit = 22500;
      dailyLimit = 750;
      mixpanel.people.set(email, {
        plan: "premium",
        price: amount,
      });
    } else if (amount > 129 || amount == 170 || amount == 140) {
      planName = "unlimited";
      monthlyLimit = 300000;
      dailyLimit = 100000;
      mixpanel.people.set(email, {
        plan: "unlimited",
        price: amount,
      });
    }
    mixpanel.track("plan purchased v1", {
      distinct_id: email,
      price: amount,
    });
    addmailingfn(email, mailingjson.paidusers);
    const mainRef = db.collection("users").doc(email);
    let startDate = new Date();
    let endDate = new Date().setDate(startDate.getDate() + 365);
    console.log(
      new Date(endDate),
      startDate,
      planName,
      monthlyLimit,
      dailyLimit
    );
    const finalPlanDetails = {
      endDate: new Date(endDate),
      startDate,
      planName,
      monthlyLimit,
      dailyLimit,
      planStarted: 1,
    };
    const idnew = email + "v2Id";
    if (planName == "basic") {
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.resumeLimit = 1;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    } else if (planName == "premium") {
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.resumeLimit = 5;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    } else if (planName == "unlimited") {
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.resumeLimit = 10;
      finalPlanDetails.planType = "individual";
      finalPlanDetails.membertype = "admin";
    }
    if (planName == "gold") {
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.resumeLimit = 20;
      finalPlanDetails.planType = "enterprise";
      finalPlanDetails.membertype = "admin";
      finalPlanDetails.userLimit = 4;
    }
    if (planName == "platinum") {
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.resumeLimit = 100;
      finalPlanDetails.planType = "enterprise";
      finalPlanDetails.membertype = "admin";
      finalPlanDetails.userLimit = 15;
    }
    if (planName == "diamond") {
      finalPlanDetails.v2Id = idnew;
      finalPlanDetails.resumeLimit = 1000;
      finalPlanDetails.planType = "enterprise";
      finalPlanDetails.membertype = "admin";
      finalPlanDetails.userLimit = 1000;
    }

    mainRef
      .get()
      .then(function (docRef) {
        if (docRef.exists) {
          const data = docRef.data();
          if (data.planDetails.planStarted === 1) {
            console.log("plan already started");
            if (data.planDetails.planName == "basic") {
              if (planName == "premium" || planName == "unlimited") {
                upgradePlan("", planName, email)
                  .then((res) => {
                    console.log("res", res);
                  })
                  .catch((err) => {
                    console.log("err", err);
                  });
              }
            } else if (data.planDetails.planName === "premium") {
              if (planName == "unlimited") {
                upgradePlan("", planName, email)
                  .then((res) => {
                    console.log("res", res);
                  })
                  .catch((err) => {
                    console.log("err", err);
                  });
              }
            }
          } else {
            mainRef
              .update({
                planDetails: finalPlanDetails,
              })
              .then(() => {
                console.log("success for plan update on email", email);
              })
              .catch((e) =>
                console.log("firebase plan update error for email", email)
              );
          }
        } else {
          console.log("no doc exist by this email");
          const planDetails = finalPlanDetails;
          if (name != "") {
            mainRef
              .set({
                id: "",
                name: name,
                picture: "",
                email: email,
                planDetails: planDetails,
              })
              .then(() => {
                console.log("success plan created also");
              })
              .catch((err) => {
                console.log("some error occured", err);
              });
          }
        }
      })
      .catch((err) => {
        console.log("some error occured");
      });
  }
  console.log("Payment capture completed");
};

// Route for handling the PayPal webhook event
app.post("/webhookpaypal", async (req, res) => {
  // Verify the signature
  console.log("req", req.body);
  if (verifyPayPalSignature(req.headers, JSON.stringify(req.body))) {
    // Signature is valid, process the webhook event
    const event = req.body;
    console.log(
      "Received webhook event:",
      event,
      event?.resource,
      event?.resource?.purchase_units
    );
    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED":
        const number1 = event?.resource?.purchase_units?.[0]?.amount.value;
        const amount1 = parseFloat(number1);
        const orderid1 = event?.resource?.id;
        console.log("orderid", orderid1);
        const { email1, name1 } = await searchTransactions(orderid1);
        // mainfn(number1, amount1, orderid1, email1, name1);
        break;
      case "PAYMENT.CAPTURE.COMPLETED":
        const number = event?.resource?.amount.value;
        const amount = parseFloat(number);
        const orderid = event?.supplementary_data?.related_ids?.order_id;
        const { email, name } = await searchTransactions(orderid);
        // mainfn(number, amount, orderid, email, name);
        break;
      case "PAYMENT.CAPTURE.DENIED":
        // Payment capture denied logic
        console.log("Payment capture denied");
        break;
      // Add more cases for other webhook event types as needed
      default:
        // Unsupported event type
        console.log("Unsupported event type", event.event_type);
    }

    res.sendStatus(200);
  } else {
    // Signature is invalid, reject the request
    console.log("Webhook signature verification failed");
    res.sendStatus(400);
  }
});

async function fetchCertificate(certUrl) {
  const response = await axios.get(certUrl);
  return response.data;
}

function verifyPayPalSignature(headers, requestBody) {
  const paypalSignature = headers["paypal-transmission-sig"];

  const payload =
    Object.keys(headers)
      .sort()
      .map((key) => `${key}:${headers[key]}`)
      .join("\n") +
    "\n" +
    requestBody;

  const certUrl = headers["paypal-cert-url"];

  return fetchCertificate(certUrl)
    .then((certificate) => {
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(payload, "utf8");
      return verifier.verify(certificate, paypalSignature, "base64");
    })
    .catch((error) => {
      console.error("Error fetching or verifying PayPal certificate:", error);
      return false;
    });
}

// use the orders api to capture payment for an order
async function capturePayment(orderId) {
  const accessToken = await generateAccessToken1();
  const url = `${baseURL.production}/v2/checkout/orders/${orderId}/capture`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log("url", url);
  const data = await response.json();
  console.log("data", data);
  return data;
}

// generate an access token using client id and app secret
async function generateAccessToken1() {
  const auth = Buffer.from(
    process.env.PAYPAL_CLIENT_ID_MAIN + ":" + process.env.PAYPAL_APP_SECRET_MAIN
  ).toString("base64");
  const response = await fetch(`${baseURL.production}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const data = await response.json();
  console.log("token", data);
  return data.access_token;
}

app.use("/v2", authenticateToken, v2Routes);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port},ok`);
});

exports.db = db;
exports.uuidv4 = uuidv4;
exports.addmailingfn = addmailingfn;
exports.mixpanel = mixpanel;
exports.admin = admin;