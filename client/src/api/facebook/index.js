export default class facebookAPI{
    getScript() {
        return new Promise((resolve) => {
            if (window.FB) {
                resolve(window.FB);
            }

            const id = 'facebook-jssdk';
            const fjs = document.querySelectorAll('script')[0];
            if (document.getElementById(id)) {
                return;
            }

            const js = document.createElement('script');
            js.id = id;
            js.src = '//connect.facebook.net/en_US/sdk.js';

            js.addEventListener('load', () => {
                Object.assign(this, {
                    AppEvents: window.FB.AppEvents,
                    Canvas: window.FB.Canvas,
                    Event: window.FB.Event,
                    Frictionless: window.FB.Frictionless,
                    XFBML: window.FB.XFBML,
                });

                resolve(window.FB);
            });

            fjs.parentNode.insertBefore(js, fjs);
        });
    }

    init(params = {}) {
        return new Promise(async (resolve) => {
            const FB = await this.getScript();
            FB.init(params);

            resolve(FB);
        });
    }

    api(...params) {
        return new Promise(async (resolve) => {
            const FB = await this.getScript();

            const callback = (response) => {
                resolve(response);
            };

            if (params.length > 3) {
                params = params.slice(0, 3);
            }

            params.push(callback);

            FB.api(...params);
        });
    }

    ui(params) {
        return new Promise(async (resolve) => {
            const FB = await this.getScript();

            FB.ui(params, (response) => {
                resolve(response);
            });
        });
    }

    getLoginStatus() {
        return new Promise(async (resolve) => {
            const FB = await this.getScript();

            FB.getLoginStatus((response) => {
                resolve(response);
            });
        });
    }

    login(params = { scope: 'public_profile,email' }) {
        return new Promise(async (resolve) => {
            const FB = await this.getScript();

            FB.login((response) => {
                resolve(response);
            }, params);
        });
    }

    logout() {
        return new Promise(async (resolve) => {
            const FB = await this.getScript();

            FB.logout((response) => {
                resolve(response);
            });
        });
    }

    getAuthResponse() {
        return new Promise(async (resolve) => {
            const FB = await this.getScript();

            resolve(FB.getAuthResponse());
        });
    }

    me(req) {
        return new Promise(async (resolve) => {
            //const me = await this.api(`/me?fields=id,email,name,picture`); // ,gender,verified,link
            const me = await this.api(`/me?fields=${req ? req : "id,email,name,picture"}`); // ,gender,verified,link

            resolve(me);
        });
    }

    picture(id, width, height) {
        // http://graph.facebook.com/463924389342821/picture?type=square&height=500&width=500&
        // https://developers.facebook.com/docs/graph-api/reference/v2.2/user/picture
        // FB.api('/{user-id}/picture', 'GET', {}, function(response) {  // Insert your code here });
        return new Promise(async (resolve) => {
            //const me = await this.api(`/me?fields=id,email,name,picture`); // ,gender,verified,link
            const pic = await this.api(`/${id}/picture?type=square&width=${width}&height=${height}`);

            resolve(pic);
        });
    }
}
