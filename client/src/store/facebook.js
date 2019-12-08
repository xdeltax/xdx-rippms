import {decorate, observable, action, runInAction} from 'mobx';

import facebookAPI from 'api/facebook';

class AuthFacebook {
  _FBisready = false;
  _fbAPI = null;

  // init (MUST NOT be async) facebook at first startup (in constructor of component (RouteLogin) thats calls api by button-click)
  constructor() {
    this._fbAPI = new facebookAPI();
    this._FBisready = false;
  }

  get isReady() { return this._FBisready }
  set isReady(v) { runInAction(() => { this._FBisready = v }) }

  get fbAPI() { return this._fbAPI }

  clear = () => {  }

  get_all() { return { fbAPI: this.fbAPI, isReady: this.isReady, }}
  set_all = action((obj) => {
    if (!obj) return;
    this._fbAPI = obj.fbAPI || null;
    this._FBisReady = obj._FBisReady || false;
  });

  initFBAPI = (timeoutMS) => {   // init must be on pageload, before any clickevent -> run in constructor
    return new Promise( (resolve, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(false);
      }, timeoutMS || 5000);

      // if you forgot to setup REACT_APP_FB_APPID in .env the facebookAPI will fail silent but you get messages like: "FB.login() called before FB.init()""
      this.fbAPI.init({
          appId: global.APPCONFIG_FACEBOOK_APPID, // document.querySelector('[property=fb\\:app_id]').content, Your application ID. If you don't have one find it in the App dashboard or go there to create a new app. Defaults to null.
          autoLogAppEvents: true,
          xfbml: true,              // Determines whether XFBML tags used by social plugins are parsed, and therefore whether the plugins are rendered or not. Defaults to false.
          version: global.APPCONFIG_FACEBOOK_API_VERSION || "v3.1", //'v3.1',  // Determines which versions of the Graph API and any API dialogs or plugins are invoked when using the .api() and .ui() functions. Valid values are determined by currently available versions, such as 'v2.0'. This is a required parameter
          cookie: false,            // Determines whether a cookie is created for the session or not. If enabled, it can be accessed by server-side code. Defaults to false
          status: false,            // Determines whether the current login status of the user is freshly retrieved on every page load. If this is disabled, that status will have to be manually retrieved using .getLoginStatus(). Defaults to false.
      })
      .then( res => {
        this.isReady = true;
        clearTimeout(timer);
        return resolve(true);
      })
      .catch( err => {
        this.isReady = false;
        clearTimeout(timer);
        return reject(false);
      })
    });
  }

  askFacebook2Logout = async () => {
    try {
      if (!this.isReady) await this.initFBAPI()
      if (!this.isReady)
      throw new Error("facebookAPI not ready");

      const authResponse = await this.fbAPI.logout();
      this.clear();
      return authResponse;
    } catch (error) {
      return null;
    }
  }

  askFacebook4Accesstoken = async () => {
    //FB.login: FB.login opens the authorization window where users can authorize your App.
    //It must get called directly on user interaction (mouse click), you can´t call it right after FB.init
    //and you can´t call it in the asynchronous callback function of FB.getLoginStatus either.
    //Make sure you understand what asynchronous means, it´s very important to know for a web developer.
    //If you don´t call it on user interaction, it may get blocked by popup blockers.
    //The benefit of using FB.login for authorization is that you don´t need to redirect the user to a login screen.
    try {
      if (!this.isReady) await this.initFBAPI()
      if (!this.isReady)
      throw new Error("facebookAPI not ready");

      let loginstatus = await this.fbAPI.login();
      global.log("store:: facebook:: askFacebook4Accesstoken:: loginstatus:: ", loginstatus)
      // loginstatus::
      //    authResponse: {
      //      accessToken: "EAAFSPeVOXKkBAH036AG7R2hY2ETW6W7RJm5VpEYoniBT7jtc4…o7Q7eY0viakQ7cspe2WoCzimi4UrXmWGaWYVwEmLCEFaQZDZD",
      //      userID: "543224321742773",
      //      expiresIn: 5179346,
      //      signedRequest: "SRoqtPPV6OTAdiQ_gda2itck30qSp7xnOwVr8Vtylls.eyJ1c2…iSE1BQy1DSEEyNTYiLCJpc3N1ZWRsEXQiOjE1NjI3NTcyNDB9",
      //      data_access_expiration_time: 1570533240
      //    }
      //    status: "connected"

      if ( !loginstatus || !loginstatus.hasOwnProperty("authResponse") || !loginstatus.hasOwnProperty("status") || !loginstatus.authResponse )
      throw new Error("invalid response from facebook (loginstatus)");

      let authResponse = loginstatus.authResponse;
      // authResponse::
      //      accessToken: "EAAFSPeVOXKkBAH036AG7R2hY2ETW6W7RJm5VpEYoniBT7jtc4…o7Q7eY0viakQ7cspe2WoCzimi4UrXmWGaWYVwEmLCEFaQZDZD",
      //      userID: "543224321742773",
      //      expiresIn: 5179346,
      //      signedRequest: "SRoqtPPV6OTAdiQ_gda2itck30qSp7xnOwVr8Vtylls.eyJ1c2…iSE1BQy1DSEEyNTYiLCJpc3N1ZWRsEXQiOjE1NjI3NTcyNDB9",
      //      data_access_expiration_time: 1570533240

      if ( !authResponse.hasOwnProperty("userID") || !authResponse.hasOwnProperty("accessToken") || !authResponse.userID || !authResponse.accessToken )
      throw new Error("invalid response from facebook (authResponse)");

      return { accessToken: authResponse.accessToken, userID: authResponse.userID, error: null, }
    } catch (error) {
      return { accessToken: null, userID: null, error, };
    }
  }

  askFacebook4Me = async (req) => {
    try {
      if (!this.isReady) await this.initFBAPI()
      if (!this.isReady)
      throw new Error("facebookAPI not ready");

      let me = await this.fbAPI.me(req ? req : "id,email,name,picture");
      return me;
    } catch (error) {
      return null;
    }
  }

  askFacebook4ProfilePicture = async (dim) => {
    try {
      if (!this.isReady) await this.initFBAPI()
      if (!this.isReady)
      throw new Error("facebookAPI not ready");

      let me = await this.fbAPI.me("id");
      let pic = await this.fbAPI.picture(me.id, dim || 500, dim || 500);

      return pic;
    } catch (error) {
      //ccc("CCFacebook:: askFacebook4Me:: cached error:: ", error)
      return null;
    }
  }

};

decorate(AuthFacebook, {
  _FBisready: observable,
  clear: action,
});

export default AuthFacebook;
