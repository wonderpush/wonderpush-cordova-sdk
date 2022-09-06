package com.wonderpush.sdk.cordova;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;
import android.os.Bundle;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.util.Log;

import java.util.ArrayList;
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
import com.wonderpush.sdk.WonderPushChannel;
import com.wonderpush.sdk.WonderPushChannelGroup;
import com.wonderpush.sdk.WonderPushDelegate;
import com.wonderpush.sdk.WonderPushUserPreferences;

import com.wonderpush.sdk.cordova.JSONUtil;

public class WonderPushPlugin extends CordovaPlugin {

    static final String TAG = "WonderPush";

    private CallbackContext jsEventForwarder;

    private Delegate nativeDelegateSingleton = new Delegate();
    private CallbackContext jsDelegate;
    private Map<String, BlockingQueue<Object>> jsCallbackWaiters = new ConcurrentHashMap<>();

    @Override
    protected void pluginInitialize() {
        WonderPush.setIntegrator("wonderpush-cordova-sdk-3.2.1");

        // Forward notification clicks and data notifications receipt
        LocalBroadcastManager.getInstance(cordova.getContext()).registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (jsEventForwarder == null) return;

                Intent pushNotif = intent.getParcelableExtra(WonderPush.INTENT_NOTIFICATION_WILL_OPEN_EXTRA_RECEIVED_PUSH_NOTIFICATION);
                Bundle extras = pushNotif == null ? null : pushNotif.getExtras();
                if (extras == null || extras.isEmpty()) {
                    return;
                }
                JSONObject notification = new JSONObject();
                for (String key : extras.keySet()) {
                    try {
                        Object value = extras.get(key);
                        if (value instanceof String) {
                            String valueStr = (String) value;
                            if (valueStr.charAt(0) == '{' && valueStr.charAt(valueStr.length() - 1) == '}') {
                                try {
                                    value = new JSONObject(valueStr);
                                } catch (JSONException ex) {
                                    Log.d("WonderPush", "Tried to parse a seemingly JSON value for notification field " + key + " with value " + valueStr, ex);
                                }
                            }
                        }
                        notification.putOpt(key, JSONUtil.wrap(value));
                    } catch (JSONException ex) {
                        Log.e("WonderPush", "Unexpected error while transforming received notification intent to JSON for property " + key + " of value " + extras.get(key), ex);
                    }
                }

                JSONObject event = new JSONObject();
                try {
                    event.put("type", "notificationOpen");
                    event.put("notification", notification);
                    event.put("notificationType", intent.getStringExtra(WonderPush.INTENT_NOTIFICATION_WILL_OPEN_EXTRA_NOTIFICATION_TYPE));
                } catch (JSONException ex) {
                    Log.e("WonderPush", "Unexpected error while creating notificationOpen event", ex);
                    return;
                }

                PluginResult result = new PluginResult(PluginResult.Status.OK, event);
                result.setKeepCallback(true);
                jsEventForwarder.sendPluginResult(result);
            }
        }, new IntentFilter(WonderPush.INTENT_NOTIFICATION_WILL_OPEN));

        // Forward registered callbacks
        IntentFilter registeredMethodIntentFilter = new IntentFilter();
        registeredMethodIntentFilter.addAction(WonderPush.INTENT_NOTIFICATION_BUTTON_ACTION_METHOD_ACTION);
        registeredMethodIntentFilter.addDataScheme(WonderPush.INTENT_NOTIFICATION_BUTTON_ACTION_METHOD_SCHEME);
        registeredMethodIntentFilter.addDataAuthority(WonderPush.INTENT_NOTIFICATION_BUTTON_ACTION_METHOD_AUTHORITY, null);
        LocalBroadcastManager.getInstance(cordova.getContext()).registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (jsEventForwarder == null) return;

                String method = intent.getStringExtra(WonderPush.INTENT_NOTIFICATION_BUTTON_ACTION_METHOD_EXTRA_METHOD);
                String arg = intent.getStringExtra(WonderPush.INTENT_NOTIFICATION_BUTTON_ACTION_METHOD_EXTRA_ARG);

                JSONObject event = new JSONObject();
                try {
                    event.put("type", "registeredCallback");
                    event.put("method", method);
                    event.put("arg", arg);
                } catch (JSONException ex) {
                    Log.e("WonderPush", "Unexpected error while creating registeredCallback event", ex);
                    return;
                }

                PluginResult result = new PluginResult(PluginResult.Status.OK, event);
                result.setKeepCallback(true);
                jsEventForwarder.sendPluginResult(result);
            }
        }, registeredMethodIntentFilter);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        // Internal
        if (action.equals("__callback")) {

            String callbackId = args.getString(0);
            Object value = args.get(1);
            jsCalledBack(callbackId, value);

        } else if (action.equals("__setEventForwarder")) {

            jsEventForwarder = callbackContext;
            PluginResult result = new PluginResult(PluginResult.Status.OK, (String) null);
            result.setKeepCallback(true);
            callbackContext.sendPluginResult(result);

        // Initialization
        } else if (action.equals("initialize")) {

            String clientId = args.getString(0);
            String clientSecret = args.getString(1);
            WonderPush.initialize(cordova.getContext(), clientId, clientSecret);
            callbackContext.success();

        } else if (action.equals("setUserId")) {

            String userId = args.isNull(0) ? null : args.getString(0);
            WonderPush.setUserId(userId);
            callbackContext.success();

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

        // Geolocation
        } else if (action.equals("enableGeolocation")) {

            WonderPush.enableGeolocation();
            callbackContext.success();

        } else if (action.equals("disableGeolocation")) {

            WonderPush.disableGeolocation();
            callbackContext.success();

        } else if (action.equals("setGeolocation")) {

            double latitude = args.getDouble(0);
            double longitude = args.getDouble(1);
            Location location = new Location("");
            location.setLatitude(latitude);
            location.setLongitude(longitude);
            WonderPush.setGeolocation(location);
            callbackContext.success();

        // Country, currency, locale, timeZone
        } else if (action.equals("getCountry")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getCountry()));

        } else if (action.equals("setCountry")) {

            WonderPush.setCountry(args.getString(0));
            callbackContext.success();

        } else if (action.equals("getCurrency")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getCurrency()));

        } else if (action.equals("setCurrency")) {

            WonderPush.setCurrency(args.getString(0));
            callbackContext.success();

        } else if (action.equals("getLocale")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getLocale()));

        } else if (action.equals("setLocale")) {

            WonderPush.setLocale(args.getString(0));
            callbackContext.success();

        } else if (action.equals("getTimeZone")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPush.getTimeZone()));

        } else if (action.equals("setTimeZone")) {

            WonderPush.setTimeZone(args.getString(0));
            callbackContext.success();

        // User consent
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

        } else if (action.equals("UserPreferences_getDefaultChannelId")) {

            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, WonderPushUserPreferences.getDefaultChannelId()));

        } else if (action.equals("UserPreferences_setDefaultChannelId")) {

            String id = args.getString(0);
            WonderPushUserPreferences.setDefaultChannelId(id);
            callbackContext.success();

        } else if (action.equals("UserPreferences_getChannelGroup")) {

            String id = args.getString(0);
            JSONObject rtn = this.jsonSerializeWonderPushChannelGroup(WonderPushUserPreferences.getChannelGroup(id));
            if (rtn == null) {
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, (String) null));
            } else {
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, rtn));
            }

        } else if (action.equals("UserPreferences_getChannel")) {

            String id = args.getString(0);
            JSONObject rtn = this.jsonSerializeWonderPushChannel(WonderPushUserPreferences.getChannel(id));
            if (rtn == null) {
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, (String) null));
            } else {
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, rtn));
            }

        } else if (action.equals("UserPreferences_setChannelGroups")) {

            JSONArray groupsJson = args.getJSONArray(0);
            List<WonderPushChannelGroup> groups = new ArrayList<>(groupsJson.length());
            for (int i = 0, e = groupsJson.length(); i < e; ++i) {
                groups.add(this.jsonDeserializeWonderPushChannelGroup(groupsJson.optJSONObject(i)));
            }
            WonderPushUserPreferences.setChannelGroups(groups);
            callbackContext.success();

        } else if (action.equals("UserPreferences_setChannels")) {

            JSONArray channelsJson = args.getJSONArray(0);
            List<WonderPushChannel> channels = new ArrayList<>(channelsJson.length());
            for (int i = 0, e = channelsJson.length(); i < e; ++i) {
                channels.add(this.jsonDeserializeWonderPushChannel(channelsJson.optJSONObject(i)));
            }
            WonderPushUserPreferences.setChannels(channels);
            callbackContext.success();

        } else if (action.equals("UserPreferences_putChannelGroup")) {

            JSONObject groupJson = args.getJSONObject(0);
            WonderPushChannelGroup group = this.jsonDeserializeWonderPushChannelGroup(groupJson);
            WonderPushUserPreferences.putChannelGroup(group);
            callbackContext.success();

        } else if (action.equals("UserPreferences_putChannel")) {

            JSONObject channelJson = args.getJSONObject(0);
            WonderPushChannel channel = this.jsonDeserializeWonderPushChannel(channelJson);
            WonderPushUserPreferences.putChannel(channel);
            callbackContext.success();

        } else if (action.equals("UserPreferences_removeChannelGroup")) {

            String id = args.getString(0);
            WonderPushUserPreferences.removeChannelGroup(id);
            callbackContext.success();

        } else if (action.equals("UserPreferences_removeChannel")) {

            String id = args.getString(0);
            WonderPushUserPreferences.removeChannel(id);
            callbackContext.success();

        } else {
            return false;
        }

        return true;
    }

    private JSONObject jsonSerializeWonderPushChannelGroup(WonderPushChannelGroup group) {
        JSONObject rtn = null;
        if (group != null) {
            rtn = new JSONObject();
            try {
                rtn.putOpt("id", group.getId());
                rtn.putOpt("name", group.getName());
            } catch (JSONException ex) {
                Log.e("WonderPush", "Unexpected error while serializing the WonderPushChannelGroup " + group, ex);
            }
        }
        return rtn;
    }

    private WonderPushChannelGroup jsonDeserializeWonderPushChannelGroup(JSONObject input) {
        WonderPushChannelGroup rtn = null;
        if (input != null) {
            try {
                rtn = new WonderPushChannelGroup(input.getString("id"))
                        .setName(JSONUtil.optString(input, "name"));
            } catch (JSONException ex) {
                Log.e("WonderPush", "Unexpected error while deserializing into a WonderPushChannelGroup " + input, ex);
            }
        }
        return rtn;
    }

    private JSONObject jsonSerializeWonderPushChannel(WonderPushChannel channel) {
        JSONObject rtn = null;
        if (channel != null) {
            rtn = new JSONObject();
            try {
                rtn.putOpt("bypassDnd", channel.getBypassDnd());
                rtn.putOpt("color", channel.getColor());
                rtn.putOpt("description", channel.getDescription());
                rtn.putOpt("groupId", channel.getGroupId());
                rtn.putOpt("id", channel.getId());
                rtn.putOpt("importance", channel.getImportance());
                rtn.putOpt("lightColor", channel.getLightColor());
                rtn.putOpt("lights", channel.getLights());
                rtn.putOpt("localOnly", channel.getLocalOnly());
                rtn.putOpt("lockscreenVisibility", channel.getLockscreenVisibility());
                rtn.putOpt("name", channel.getName());
                rtn.putOpt("showBadge", channel.getShowBadge());
                rtn.putOpt("sound", channel.getSound());
                rtn.putOpt("soundUri", channel.getSoundUri() == null ? null : channel.getSoundUri().toString());
                rtn.putOpt("vibrate", channel.getVibrate());
                rtn.putOpt("vibrateInSilentMode", channel.getVibrateInSilentMode());
                rtn.putOpt("vibrationPattern", JSONUtil.wrap(channel.getVibrationPattern()));
            } catch (JSONException ex) {
                Log.e("WonderPush", "Unexpected error while serializing the WonderPushChannel " + channel, ex);
            }
        }
        return rtn;
    }

    private WonderPushChannel jsonDeserializeWonderPushChannel(JSONObject input) {
        WonderPushChannel rtn = null;
        if (input != null) {
            try {
                rtn = new WonderPushChannel(input.getString("id"), JSONUtil.optString(input, "groupId"))
                        .setName(JSONUtil.optString(input, "name"))
                        .setDescription(JSONUtil.optString(input, "description"))
                        .setBypassDnd(JSONUtil.optBoolean(input, "bypassDnd"))
                        .setShowBadge(JSONUtil.optBoolean(input, "showBadge"))
                        .setImportance(JSONUtil.optInteger(input, "importance"))
                        .setLights(JSONUtil.optBoolean(input, "lights"))
                        .setVibrate(JSONUtil.optBoolean(input, "vibrate"))
                        .setVibrationPattern(JSONUtil.optLongArray(input, "vibrationPattern"))
                        .setLightColor(JSONUtil.optInteger(input, "lightColor"))
                        .setLockscreenVisibility(JSONUtil.optInteger(input, "lockscreenVisibility"))
                        .setSound(JSONUtil.optBoolean(input, "sound"))
                        .setSoundUri(JSONUtil.optUri(input, "soundUri"))
                        .setVibrateInSilentMode(JSONUtil.optBoolean(input, "vibrateInSilentMode"))
                        .setColor(JSONUtil.optInteger(input, "color"))
                        .setLocalOnly(JSONUtil.optBoolean(input, "localOnly"));
            } catch (JSONException ex) {
                Log.e("WonderPush", "Unexpected error while deserializing into a WonderPushChannel " + input, ex);
            }
        }
        return rtn;
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
