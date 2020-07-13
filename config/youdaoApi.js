SESSION_URL = "https://fanyi.youdao.com";
TRANSLATE_URL =
  "https://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule";
USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36";

var session;
var bv;
var requestTranslation;
var initSession;

if (!session) {
  session = Request.jar();

  requestTranslation = () => {
    return new Promise((resolve, reject) => {
      let ts = "" + new Date().getTime();
      let salt = ts + parseInt(10 * Math.random(), 10);
      let sign = md5(
        "fanyideskweb" + text + salt + "n%A-rKaT5fb[Gy?;N5@Tj",
        "hex"
      );

      Request.post(TRANSLATE_URL, {
        jar: session,
        gzip: true,
        headers: {
          Referer: SESSION_URL,
          "User-Agent": USER_AGENT
        },
        form: {
          from: "ja",
          to: "zh-CHS",
          i: text,
          salt: salt,
          ts: ts,
          smartresult: "dict",
          client: "fanyideskweb",
          doctype: "json",
          version: "2.1",
          keyfrom: "fanyi.web",
          action: "FY_BY_REALTIME",
          typoResult: false,
          sign: sign,
          bv: bv
        }
      })
        .then(body => {
          let sentences = JSON.parse(body).translateResult[0];
          let result = "";
          for (let i in sentences) {
            result += sentences[i].tgt;
          }
          callback(result);
        })
        .catch(err => {
          return initSession();
        });
    });
  };

  initSession = () => {
    return Request.get(SESSION_URL, {
      jar: session,
      gzip: true,
      headers: {
        Referer: SESSION_URL,
        "User-Agent": USER_AGENT
      }
    })
      .then(() => {
        bv = md5("5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3915.0 Safari/537.36 Edg/79.0.287.0", "hex");
        let ts = "" + new Date().getTime();
        session.setCookie(Request.cookie(`___rl__test__cookies=${ts - 10}`));
      })
      .then(requestTranslation);
  };

  result = initSession();
} else {
  result = requestTranslation();
}
