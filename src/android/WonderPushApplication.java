package com.wonderpush.sdk.cordova;

import com.wonderpush.sdk.WonderPush;

import android.app.Application;

public class WonderPushApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        WonderPush.setLogging(true);
        WonderPush.initialize(this);
    }

}
