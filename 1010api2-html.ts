
export class API2Client {

  version:string = '';

  constructor(version='') {
    // TODO: No login function yet -- we're assuming the user already has cookies.
    this.version = version;
  }

  _fmt(ep, fmt_) {
    fmt_ = fmt_ || ':json';
    if (!fmt_.startsWith(':')) fmt_ = ':' + fmt_;
    if (ep.startsWith('/')) ep = ep.slice(1);
    let ee = ep.split('?'); if (!ee[0].endsWith(fmt_)) { ee[0] += fmt_; } ep = ee.join('?');
    return ep;
  }

  _url(ep, fmt_) {
    let result = `/api/${this._fmt(ep, fmt_)}`;
    if (this.version !== '') result = '/' + this.version + result;
    return result;
  }

  // main API2 entry point:
  call(ep, args, type='application/json'):Promise<any> {
    if (!args) args = {};
    var self = this, data = args ? JSON.stringify(args) : '';
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open(args.method_ || "POST", self._url(ep, args.fmt_), true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== xhr.DONE) return;
        if (xhr.status !== 200) reject(xhr);
        // TODO: only parse if fmt_.startsWith(json)
        else try { resolve(JSON.parse(xhr.responseText)) }
        catch (e) { reject(e) }};
      xhr.setRequestHeader('Content-type', type || 'application/json');
      xhr.send(data); }) }
}

export class API2Widget {
  api2: API2Client;
  tag: number;
  name: string;

  constructor(api2:API2Client, tag:number, name:string) {
    this.api2 = api2;
    this.tag = tag;
    this.name = name;
  }

  invoke(method:string, args:object):Promise<any> {
    let ep = `${this.tag}/${this.name}/!${method}`;
    return this.api2.call(ep, args)
  }
}
