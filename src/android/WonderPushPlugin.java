package com.wonderpush.sdk.cordova;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.wonderpush.sdk.WonderPush;

public class WonderPushPlugin extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        // WonderPush.setLogging(true);

        if (action.equals("initialize")) {
            WonderPush.initialize(this.cordova.getActivity().getApplicationContext());

            return true;
        } else if (action.equals("trackEvent")) {
            String type = args.getString(0);

            if (args.length() == 2) {
                JSONObject customData = args.getJSONObject(1);
                WonderPush.trackEvent(type, customData);
            } else {
                WonderPush.trackEvent(type);
            }

            return true;
        } else if (action.equals("putInstallationCustomProperties")) {
            JSONObject custom = args.getJSONObject(0);
            WonderPush.putInstallationCustomProperties(custom);

            return true;
        } else if (action.equals("setNotificationEnabled")) {
            boolean enabled = args.getBoolean(0);
            WonderPush.setNotificationEnabled(enabled);

            return true;
        }

        return false;
    }

}
