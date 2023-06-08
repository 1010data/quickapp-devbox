const https = require('https');

class API2Error {
  constructor(status, responseType, responseText) {
    this.status = status;
    this.responseType = responseType;
    this.responseText = responseText;
  }
}

class API2Client {

  /// Creates a new API2Client. No arguments.
  constructor() {
    this.box = 'www2.corp.1010data.com';
    this.ver = 'prime-latest';
    this.uid = '';
    this.epw = '';
    this.sid = '';
  }

  isLoggedIn() { return this.sid !== '' }
  cookie() { return this.isLoggedIn() ? `session=${this.uid}|${this.sid}|${this.epw}` : '' }

  /// Call an API2 method.
  /// endp: the endpoint (everything in the URL after /api/)
  /// body: the (json) post body
  /// returns a promise that resolves when the data arrives.
  call(endp, body) {
    if (endp.startsWith('/')) endp = endp.slice(1);
    // force :json ... TODO: disable this, and only JSON.parse() if the server returns JSON.
    // .includes() here also allows :json.rows
    let ee = endp.split('?'); if (!ee[0].includes(':json')) { ee[0]+=':json'; } endp = ee.join('?');
    let self = this;
    return new Promise(function (resolve, reject) {
      let req = https.request({
        hostname: self.box,
        path: `/${self.ver}/api/${endp}`,
        method: 'POST',  // TODO: allow GET?
        headers: {
          'Content-type': 'application/json',
          'Content-length': (body||'').length,
          'Cookie': self.cookie() },
        rejectUnauthorized: self.box.includes('.')  // no '.' means dev host -- ignore ssl errors
      }, res => {
        let buf = '';
        res.on('data', s => { buf += s });
        res.on('end', _ => {
          if (res.statusCode !== 200) {
            console.log("-- error from server ------------------------------------");
            console.log(res.statusCode);
            console.log(res.headers);
            console.log(buf);
            console.log("---------------------------------------------------------");
            reject(new API2Error(res.statusCode, res.headers['content-type'], buf))
          } else try { resolve(JSON.parse(buf)) }
          // TODO: handle non-json responses (send back res or buf instead of JSON.parse(buf))
          catch (e) {
            console.log('-- error parsing response -----------------------------');
            console.log(res.statusCode);
            console.log(res.headers);
            console.log(buf);
            console.log('-------------------------------------------------------');
            reject('Error calling ' + endp + ' : ' + e.message + '\n' + buf) }
        })
      });
      if (body) req.write(body);
      console.log('sending request to ' + endp);
      req.end();
    });
  }

  /// log into 1010edge, using credentials in d ({ host?, ver?, uid, pwd })
  /// returns a promise that resolves to the API2Client once it logs in.
  login(d) {
    if (d.host) this.box = d.host;
    if (d.ver) this.ver = d.ver;
    if (d.uid) this.uid = d.uid; else throw Error('Expected d.uid in API2Client.login(d)!');
    if (!d.pwd) throw Error('Expected d.pwd in API2Client.login(d)!');

    // let postBody = JSON.stringify({uid: this.uid, pw: d.pwd});
    let postBody = `uid=${this.uid}&pw=${d.pwd}`; // TODO: either url escape the password this OR get json working for !login
    console.log(`attempting to log into ${this.box}/${this.ver} as user ${this.uid}...`);

    // TODO: replace this with self.call('!login') once login accepts application/json
    let self = this;
    return new Promise(function (resolve, reject) {
      let req = https.request({
        hostname: self.box,
        path: `/${self.ver}/api/!login:json`,
        method: 'POST',
        headers: {
          'Content-type': 'application/x-www-form-urlencoded',
          'Content-length': postBody.length },
        rejectUnauthorized: self.box.includes('.'),
      }, res => {
        let buf = '';
        res.on('data', chunk => {  buf += chunk; });
        res.on('end', () => {
          try {
            let usp = JSON.parse(buf);
            if (usp.error) { console.warn(buf); reject(usp.error) }
            else {
              if (usp.uid !== self.uid) { // TODO: actually test email-style cloud logins
                console.log(`note: uid changed at login. was: ${self.uid}. now: ${usp.uid}`);
                self.uid = usp.uid; }
              self.sid = usp.sid
              self.epw = usp.epw
              resolve(self) }
          } catch (e) { reject('Failed to log in: ' + e.message + '\n\n' + buf); }
        });
      });
      req.write(postBody);
      req.end();
    });
  }
}

module.exports = { API2Client, API2Error };
