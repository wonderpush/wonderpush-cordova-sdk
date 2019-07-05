package com.wonderpush.sdk.cordova;

import android.util.Log;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.wonderpush.sdk.DeepLinkEvent;
import com.wonderpush.sdk.WonderPush;
import com.wonderpush.sdk.WonderPushDelegate;

public class WonderPushPlugin extends CordovaPlugin {

    static final String TAG = "WonderPush";

    private Delegate nativeDelegateSingleton = new Delegate();
    private CallbackContext jsDelegate;
    private Map<String, BlockingQueue<Object>> jsCallbackWaiters = new ConcurrentHashMap<>();

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        // Internal
        if (action.equals("__callback")) {

            String callbackId = args.getString(0);
            Object value = args.get(1);
            jsCalledBack(callbackId, value);

        // Initialization
        } else if (action.equals("setUserId")) {

            String userId = args.isNull(0) ? null : args.getString(0);
            WonderPush.setUserId(userId);
            callbackContext.success();

        } else if (action.equals("isReady")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.isReady()));

        } else if (action.equals("setLogging")) {

            boolean enabled = args.getBoolean(0);
            WonderPush.setLogging(enabled);
            callbackContext.success();

        } else if (action.equals("setDelegate")) {

            boolean enabled = args.getBoolean(0);
            jsDelegate = callbackContext;
            WonderPush.setDelegate(enabled ? nativeDelegateSingleton : null);
            PluginResult result = new PluginResult(PluginResult.Status.OK);
            result.setKeepCallback(true);
            callbackContext.sendPluginResult(result);

        // Core information
        } else if (action.equals("getUserId")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getUserId()));

        } else if (action.equals("getInstallationId")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getInstallationId()));

        } else if (action.equals("getDeviceId")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getDeviceId()));

        } else if (action.equals("getPushToken")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getPushToken()));

        } else if (action.equals("getAccessToken")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getAccessToken()));

        // Installation data and events
        } else if (action.equals("trackEvent")) {

            String type = args.getString(0);

            if (args.length() == 2) {
                JSONObject customData = args.getJSONObject(1);
                WonderPush.trackEvent(type, customData);
            } else {
                WonderPush.trackEvent(type);
            }
            callbackContext.success();

        } else if (action.equals("addTag") || action.equals("removeTag")) {

            // This can be called with a single string or a single array of strings
            String[] tags = null;
            Object value = args.get(0); // can be a string or an array of strings
            if (value instanceof JSONArray) {
                JSONArray argTags = (JSONArray) value;
                List<String> tagsList = new LinkedList<>();
                for (int i = 0; i < argTags.length(); ++i) {
                    Object v = argTags.get(i);
                    if (v instanceof String) {
                        tagsList.add((String) v);
                    }
                }
                tags = tagsList.toArray(new String[]{});
            } else if (value instanceof String) {
                tags = new String[]{(String) value};
            }
            if (tags != null) {
                if (action.equals("addTag")) {
                    WonderPush.addTag(tags);
                } else {
                    WonderPush.removeTag(tags);
                }
            }
            callbackContext.success();

        } else if (action.equals("removeAllTags")) {

            WonderPush.removeAllTags();
            callbackContext.success();

        } else if (action.equals("getTags")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, new JSONArray(WonderPush.getTags())));

        } else if (action.equals("hasTag")) {

            String tag = args.getString(0);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.hasTag(tag)));

        } else if (action.equals("setProperty")) {

            String field = args.getString(0);
            Object value = args.get(1);
            WonderPush.setProperty(field, value);
            callbackContext.success();

        } else if (action.equals("unsetProperty")) {

            String field = args.getString(0);
            WonderPush.unsetProperty(field);
            callbackContext.success();

        } else if (action.equals("addProperty")) {

            String field = args.getString(0);
            Object value = args.get(1);
            WonderPush.addProperty(field, value);
            callbackContext.success();

        } else if (action.equals("removeProperty")) {

            String field = args.getString(0);
            Object value = args.get(1);
            WonderPush.removeProperty(field, value);
            callbackContext.success();

        } else if (action.equals("getPropertyValue")) {

            String field = args.getString(0);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, new JSONObject(Collections.singletonMap("__wrapped", WonderPush.getPropertyValue(field)))));

        } else if (action.equals("getPropertyValues")) {

            String field = args.getString(0);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, new JSONArray(WonderPush.getPropertyValues(field))));

        } else if (action.equals("getProperties")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getProperties()));

        } else if (action.equals("putProperties")) {

            JSONObject properties = args.getJSONObject(0);
            WonderPush.putProperties(properties);
            callbackContext.success();

        } else if (action.equals("getInstallationCustomProperties")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getInstallationCustomProperties()));

        } else if (action.equals("putInstallationCustomProperties")) {

            JSONObject custom = args.getJSONObject(0);
            WonderPush.putInstallationCustomProperties(custom);
            callbackContext.success();

        // Push notification handling
        } else if (action.equals("subscribeToNotifications")) {

            WonderPush.subscribeToNotifications();
            callbackContext.success();

        } else if (action.equals("isSubscribedToNotifications")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.isSubscribedToNotifications()));

        } else if (action.equals("unsubscribeFromNotifications")) {

            WonderPush.unsubscribeFromNotifications();
            callbackContext.success();

        } else if (action.equals("getNotificationEnabled")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getNotificationEnabled()));

        } else if (action.equals("setNotificationEnabled")) {

            boolean enabled = args.getBoolean(0);
            WonderPush.setNotificationEnabled(enabled);
            callbackContext.success();

        } else if (action.equals("getUserConsent")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getUserConsent()));

        } else if (action.equals("setUserConsent")) {

            boolean enabled = args.getBoolean(0);
            WonderPush.setUserConsent(enabled);
            callbackContext.success();

        } else if (action.equals("clearAllData")) {

            WonderPush.clearAllData();
            callbackContext.success();

        } else if (action.equals("clearEventsHistory")) {

            WonderPush.clearEventsHistory();
            callbackContext.success();

        } else if (action.equals("clearPreferences")) {

            WonderPush.clearPreferences();
            callbackContext.success();

        } else if (action.equals("downloadAllData")) {

            WonderPush.downloadAllData();
            callbackContext.success();

        } else {
            return false;
        }

        return true;
    }

    private class Delegate implements WonderPushDelegate {

        @Override
        public String urlForDeepLink(DeepLinkEvent event) {
            CallbackContext delegate = WonderPushPlugin.this.jsDelegate;
            if (delegate == null) {
                return event.getUrl();
            }
            String jsCallbackWaiterId = createJsCallbackWaiter();
            try {
                JSONObject info = new JSONObject();
                info.put("method", "urlForDeepLink"); // that's the Android name of this method
                info.put("__callbackId", jsCallbackWaiterId);
                info.put("url", event.getUrl());
                PluginResult call = new PluginResult(PluginResult.Status.OK, info);
                call.setKeepCallback(true);
                delegate.sendPluginResult(call);
            } catch (JSONException ex) {
                Log.e(TAG, "Unexpected JSONException while calling JavaScript plugin delegate", ex);
            }
            AtomicReference<Object> valueRef = waitJsCallback(jsCallbackWaiterId, 3, TimeUnit.SECONDS);
            Object value = valueRef == null ? null : valueRef.get();
            if (valueRef != null && value != null && !(value instanceof String)) {
                Log.e(TAG, "WonderPushDelegate.urlForDeepLink expected a string from JavaScript, got a " + value.getClass().getCanonicalName() + ": " + value, new IllegalArgumentException());
                valueRef = null;
                value = null;
            }
            if (valueRef != null && (value == null || value instanceof String)) {
                return (String) value;
            } else {
                return event.getUrl();
            }
        }

    }

    private String createJsCallbackWaiter() {
        String id = UUID.randomUUID().toString();
        jsCallbackWaiters.put(id, new ArrayBlockingQueue(1));
        return id;
    }

    private AtomicReference<Object> waitJsCallback(String id, long timeout, TimeUnit unit) {
        if (id == null) {
            Log.e(TAG, "Cannot wait for JavaScript, callback with a null id", new NullPointerException());
            return null;
        }
        BlockingQueue<Object> queue = jsCallbackWaiters.get(id);
        if (queue == null) {
            Log.e(TAG, "Cannot wait for JavaScript, callback does not exist: " + id, new IllegalStateException());
            return null;
        }
        try {
            Object value = queue.poll(timeout, unit);
            if (value == null) {
                Log.w(TAG, "Timed out while waiting for a JavaScript callback: " + id, new TimeoutException());
                return null;
            }
            return new AtomicReference<Object>(value);
        } catch (InterruptedException ex) {
            Log.e(TAG, "Interrupted while waiting for a JavaScript callback: " + id, ex);
            return null;
        } finally {
            jsCallbackWaiters.remove(id);
        }
    }

    private void jsCalledBack(String id, Object value) {
        if (value == null) value = JSONObject.NULL;
        BlockingQueue<Object> queue = jsCallbackWaiters.get(id);
        if (queue == null) {
            Log.e(TAG, "Cannot record a JavaScript callback, callback does not exist (too late?): " + id, new IllegalStateException());
            return;
        }
        boolean succeeded = queue.offer(value);
        if (!succeeded) {
            Log.e(TAG, "Cannot record a JavaScript callback, value already recorded: " + id, new IllegalStateException());
        }
    }

}
