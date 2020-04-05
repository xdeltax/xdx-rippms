import React from 'react';
import { toJS } from 'mobx';
import { observer }  from 'mobx-react';
import { withStyles } from '@material-ui/core/styles';
import * as blobUtil from 'blob-util'

import {unixtime} from "tools/datetime";
import {random} from "tools/random";
import OAuth from 'ui/components/authentication/OAuth.js';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

// assets
import AppLogo from 'assets/applogo.svg';
import GoogleLogo from 'assets/Google_Logo_512x512.svg';
import FacebookLogo from 'assets/Facebook_Logo_(2019)_144x144.png';
//import InstagramLogo from 'assets/Instagram_Logo_2016.svg';

import socketio  from 'socketio';
import memStore  from 'memStore'; // memory-store (non-persistent, non-reactive)
import mobxStore from 'mobxStore';// mobx-store (non-persistent, reactive)
import dbStore   from 'dbStore';  // pouchdb-store (persistent on local client)

import PouchDB from 'pouchdb-core';

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("StartScreen.js");
//============================================================================//

const styles = theme => ({
  root: {
  },
  button: {
    margin: 5,
  },
  fontIndieItalic: {
    fontFamily: 'Indie Flower',
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width:"100%",
    textShadow: "0px 2px 1px rgba(0,0,0,0.3)",
    fontStyle: "italic",
    fontWeight: 900,
    color: "rgba(255,255,255,1.0)"
  },
});

export default withStyles(styles)( observer( class extends React.Component {
  state = {  }

  onAuthSuccess = async (socketid, provider, userdataFromServer) => {
  	//global.log("OAuth:: Success:: Callback:: ", socketid, provider, userObject);
    // userdataFromServer = {
    //   status: "login with provider",
    //   provider: provider,
    //   socketid: socketid,    //
  	//	 user: { ... }
    //   usercard ...
  	// }
    await mobxStore.auth.doAuthLogin(socketid, provider, null, userdataFromServer);
  }

  onAuthFailed = async (socketid, provider, error) => {
  	//global.log("OAuth:: Failed:: Callback:: ", socketid, provider, error);
    await mobxStore.auth.doAuthLogin(socketid, provider, error, null);
  }

  render() {
    const {
      classes,  // withStyles(styles)
      history,  // history: {length: 50, action: "POP", location: {…}, createHref: ƒ, push: ƒ, …} -> router-history::  history.push('/dashboard/users/1');
    } = this.props;

    clog("### render:: ", this.props);

    return (
      <div className={classes.root} style={{
        position: "relative",
        overflow: "auto",
        height: "100%",
        width: "100%",
        color: memStore.color.login.text,
        background: memStore.color.login.background,
      }}>
        <div style={{ position: "relative", top: 0, height: "30vh", minHeight: "150px", backgroundColor:"transparent" }}>
          <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 72, }}>xdx</Typography>
          <img width="100%" height="100%" src={AppLogo} alt="" />
        </div>

        <div>
          <OAuth buttonText="bind with facebook" uid="" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
          <OAuth buttonText="bind with google" uid="" provider="google" providerLogo={GoogleLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
          <OAuth buttonText="fake1 with fb" uid="fake1" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
          <OAuth buttonText="fake1999 with fb" uid="fake1999" provider="facebook" providerLogo={FacebookLogo} server={global.serverURL} socket={socketio.socket} fingerprint={global.fingerprint} onAuthSuccess={this.onAuthSuccess} onAuthFailed={this.onAuthFailed} />
				</div>

        <div>
          <Button className={classes.button} style={{width:150, height:150}} variant="contained" color="primary" onClick={ async (event) => {
            // phase example will render phaser-container hidden at app start and pause the game until this "route" is called
            // no rendering of a container(-route) here because container is already rendered in AppRouter on app-start
            // but hidden to keep the game-assets and running or paused in background. otherwise it would be destroyed and re-init on gui-change
            history && history.push('/game');
          }}>
            <Typography className={classes.fontIndieItalic} align="center" noWrap style={{fontSize: 32, }}>phaser</Typography>
          </Button>
        </div>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const basemapsresult = await dbStore.basemaps.getAllDocuments({include_docs: true, attachments: true,});
            clog("status::", "basemaps result::", basemapsresult);
          } catch (error) {
            clog("createmap::", "error::", error);
          }
        }}>getMaps</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const docId = "map0";
            const attachmentId = "1";
            const buffer = await dbStore.basemaps.getAttachmentAsBuffer(docId, attachmentId);
            clog("status::", "getAttachement result::", buffer);
          } catch (error) {
            clog("getAttachement::", "error::", error);
          }
        }}>getAttachement</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const query = { mapid: 0, width: 5, height: 5 };
            const {width, height, mapid} = query;
            if (width > 0) {
              const t1 = unixtime();
              const result = await dbStore.basemaps.DEBUG_createTestData(+mapid || 0, +width, +height || +width);
              const t2 = unixtime();
              clog("createmap:: result:: ", width, height, mapid, t2 - t1);
            }
          } catch (error) {
            clog("createmap::", "error::", error);
          }
        }}>createMap</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const callback = {
              onChange(change) {
                /*{
                    id: "testid",
                    changes: Array(1),
                    doc: {
                      testkey: "test4"
                      time: 1586111617.626
                      updatedAt: 1586111617.629
                      _id: "testid"
                      _rev: "31-365fc1ce426d7cbadc7faf6b0df62052"
                    },
                    seq: 22
                  }
                */
                clog("changes from basemaps:: ", "onChange:: ", change);
              },
              onComplete(info) { clog("changes from basemaps:: ", "onComplete:: ", info); },
              onError(err)     { clog("changes from basemaps:: ", "onError:: ", err); },
            };
            dbStore.basemaps.subscribeToChanges({ }, callback);
            clog("subscribeToChanges::",);
          } catch (error) {
            clog("subscribeToChanges::", "error::", error);
          }
        }}>subscribeToChanges</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            dbStore.basemaps.unsubscribeToChanges();
            clog("unsubscribeToChanges::",);
          } catch (error) {
            clog("unsubscribeToChanges::", "error::", error);
          }
        }}>unsubscribeToChanges</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const databaseURL = "http://localhost:3333/db/";
            const databaseName= "basemaps";
            const options = {
              //filter: 'app/by_agent',
              //query_params: { "agent": agent },
            };
            const callback = {
              onChange(change)  {
                /*{
                    doc_write_failures: 0
                    docs: Array(2)
                      0: {validate_doc_update: "function(newDoc, oldDoc, userCtx) { throw({forbidden : 'not able now!'}); }", updatedAt: 1586111617.54, createdAt: 1586111404.787, _id: "_design/test", _rev: "8-4870e1214227fce1be58cfa19cf2341a", …}
                      1: {testkey: "test4", time: 1586111617.626, updatedAt: 1586111617.629, _id: "testid", _rev: "31-365fc1ce426d7cbadc7faf6b0df62052", …}
                    length: 2
                    docs_read: 2
                    docs_written: 2
                    errors: []
                    last_seq: 1123
                    ok: true
                    start_time: "2020-04-05T18:33:38.647Z"
                  }
                */
                clog("replication from basemaps:: ", "onChange:: ", change);
                if (change.deleted) ; else ;
              },
              onPaused(err)     { clog("replication from basemaps:: ", "onPaused:: ", err); },
              onComplete(info)  { clog("replication from basemaps:: ", "onComplete:: ", info); }, // live: true -> not triggered (use pause instead)
              onActive()        { clog("replication from basemaps:: ", "onActive:: ", ); },
              onDenied(err)     { clog("replication from basemaps:: ", "onDenied:: ", err); },
              onError(err)      { clog("replication from basemaps:: ", "onError:: ", err); },
            };
            dbStore.basemaps.startReplicationFrom(databaseURL + databaseName, options, callback);
            clog("startReplicationFrom::", "basemaps");
          } catch (error) {
            clog("startReplicationFrom::", "error::", error);
          }
        }}>startReplicationFrom</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            dbStore.basemaps.stopReplication();
            clog("stopReplication::", "basemaps");
          } catch (error) {
            clog("stopReplication::", "error::", error);
          }
        }}>stopReplication</Button>


        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            await dbStore.basemaps.replicateFrom("http://localhost:3333/db/basemaps");
            clog("one-time-ReplicationFrom::", "basemaps");
          } catch (error) {
            clog("one-time-ReplicationFrom::", "error::", error);
          }
        }}>one-time-ReplicationFrom</Button>


        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const doc0 = await fetch('http://localhost:3333/getmaps');
            clog("getmap1::", "basemaps::", doc0);
          } catch (error) {
            clog("getmap1::", "error::", error);
          }
        }}>fetch/getmaps</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const doc = await dbStore.basemaps.db.get("testid", { });
            clog("getmap1::", "basemaps:: get testid:: ", doc);
          } catch (error) {
            clog("getmap1::", "error::", error);
          }
        }}>cdb get("testid")</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const doc = await dbStore.basemaps.remotedb.get("testid", { });
            clog("getmap1::", "basemaps:: get testid:: ", doc);
            //const remotedb = new PouchDB('http://localhost:3333/db/basemaps', { skipSetup: true, });
            //const doc1 = await remotedb.allDocs();
            //const doc2 = await remotedb.get("testid", { });
            //const doc3 = await dbStore.basemaps.remotedb.allDocs();
            //clog("getmap1::", "basemaps1::", doc1);
            //clog("getmap1::", "basemaps3::", doc3);
          } catch (error) {
            clog("getmap1::", "error::", error);
          }
        }}>rdb get("testid")</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            const doc = await dbStore.basemaps.remotedb.get("testid", { });
            doc.testkey = "client" + random(100);
            const newdoc = await dbStore.basemaps.remotedb.put(doc, { });
            clog("getmap1::", "basemaps:: set testid:: ", doc, newdoc);
          } catch (error) {
            clog("getmap1::", "error::", error);
          }
        }}>rdb change("testid")</Button>

        <Button className={classes.button} variant="outlined" color="primary" onClick={ async (event) => {
          try {
            let doc = await dbStore.basemaps.remotedb.get("testid2", { });
            if (!doc) doc = {
              _id: "testid2",
              testkey: "clientX",
            };
            doc.testkey = "clientX" + random(100);
            const newdoc = await dbStore.basemaps.remotedb.put(doc, { });
            let doc2 = await dbStore.basemaps.remotedb.get("testid2", { });
            clog("getmap1::", "basemaps:: set testid2:: ", doc, newdoc, doc2);
          } catch (error) {
            clog("getmap1::", "error::", error);
          }
        }}>rdb change("testid2")</Button>

      </div>
    ) // of return
  } // of render
})); // of class
