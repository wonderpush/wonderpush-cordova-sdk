package com.wonderpush.sdk.cordova;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

import com.wonderpush.sdk.WonderPush;
import com.wonderpush.sdk.WonderPushInitializer;

import org.apache.cordova.LOG;

public class WonderPushInitializerImpl implements WonderPushInitializer {

    public void initialize(Context context) {
        int clientIdRes = context.getResources().getIdentifier("WP_CLIENT_ID", "string", context.getPackageName());
        int secretRes = context.getResources().getIdentifier("WP_CLIENT_SECRET", "string", context.getPackageName());
        String clientId = context.getString(clientIdRes);
        String clientSecret = context.getString(secretRes);

        if (clientId == null || clientId == "") {
            LOG.e("WonderPush", "Please provide CLIENT_ID when adding the plugin");
            return;
        }

        if (clientSecret == null || clientSecret == "") {
            LOG.e("WonderPush", "Please provide CLIENT_SECRET when adding the plugin");
            return;
        }

        WonderPush.initialize(context, clientId, clientSecret);
    }
}
