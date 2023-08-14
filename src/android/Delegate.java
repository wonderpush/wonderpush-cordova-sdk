package com.wonderpush.sdk.cordova;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.util.Pair;

import androidx.annotation.Nullable;

import com.wonderpush.sdk.ContextReceiver;
import com.wonderpush.sdk.DeepLinkEvent;
import com.wonderpush.sdk.WonderPushDelegate;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

public class Delegate implements WonderPushDelegate, ContextReceiver {
    public interface SubDelegate extends WonderPushDelegate {
        boolean subDelegateIsReady();
    }

    private Context context;

    private static List<WeakReference<SubDelegate>> subDelegates = new ArrayList<>();
    private static final List<Pair<JSONObject, Integer>> savedOpenedNotifications = new ArrayList<>();
    private static final List<JSONObject> savedReceivedNotifications = new ArrayList<>();

    private static final String TAG = "WonderPush";

    protected static List<Pair<JSONObject, Integer>> consumeSavedOpenedNotifications() {
        synchronized (Delegate.class) {
            List<Pair<JSONObject, Integer>> result = new ArrayList(savedOpenedNotifications);
            savedOpenedNotifications.clear();
            return result;
        }
    }

    protected static List<JSONObject> consumeSavedReceivedNotifications() {
        synchronized (Delegate.class) {
            List<JSONObject> result = new ArrayList(savedReceivedNotifications);
            savedReceivedNotifications.clear();
            return result;
        }
    }

    protected static void setSubDelegate(SubDelegate subDelegate) {
        synchronized (Delegate.class) {
            subDelegates.clear();
            subDelegates.add(new WeakReference<>(subDelegate));
        }
    }

    @Override
    public void setContext(Context context) {
        this.context = context;
    }


    @Override
    public String urlForDeepLink(DeepLinkEvent event) {
        String defaultUrl = event.getUrl();
        synchronized (Delegate.class) {
            for (WeakReference<SubDelegate> subDelegate : subDelegates) {
                WonderPushDelegate delegate = subDelegate.get();
                if (delegate == null) continue;
                String alternateUrl = delegate.urlForDeepLink(event);
                if (alternateUrl == null && defaultUrl == null) continue;
                if (alternateUrl != null && alternateUrl.equals(defaultUrl)) continue;
                return alternateUrl;
            }
        }
        return defaultUrl;
    }

    @Override
    public void onNotificationOpened(JSONObject notif, int buttonIndex) {
        synchronized (Delegate.class) {
            if (!hasReadySubDelegates()) {
                // Save for later
                savedOpenedNotifications.add(new Pair<>(notif, buttonIndex));
                return;
            }
            for (WeakReference<SubDelegate> subDelegate : subDelegates) {
                WonderPushDelegate delegate = subDelegate.get();
                if (delegate == null) continue;
                delegate.onNotificationOpened(notif, buttonIndex);
            }
        }
    }

    @Override
    public void onNotificationReceived(JSONObject notif) {
        synchronized (Delegate.class) {
            if (!hasReadySubDelegates()) {
                // Save for later
                savedReceivedNotifications.add(notif);
                return;
            }
            for (WeakReference<SubDelegate> subDelegate : subDelegates) {
                WonderPushDelegate delegate = subDelegate.get();
                if (delegate == null) continue;
                delegate.onNotificationReceived(notif);
            }
        }
    }

    private static boolean hasReadySubDelegates() {
        for (WeakReference<SubDelegate> sd : subDelegates) {
            SubDelegate subDelegate = sd.get();
            if (subDelegate != null && subDelegate.subDelegateIsReady()) {
                return true;
            }
        }
        return false;
    }

}

