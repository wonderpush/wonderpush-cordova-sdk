package com.wonderpush.sdk.cordova;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.util.Pair;

import androidx.annotation.Nullable;

import com.wonderpush.sdk.DeepLinkEvent;
import com.wonderpush.sdk.WonderPushDelegate;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

public class Delegate implements WonderPushDelegate {
    public interface SubDelegate extends WonderPushDelegate {
        boolean subDelegateIsReady();
    }

    private Context context;

    private static WeakReference<SubDelegate> subDelegate;
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
            Delegate.subDelegate = subDelegate != null ? new WeakReference<>(subDelegate) : null;
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
            SubDelegate subDelegate = Delegate.subDelegate != null ? Delegate.subDelegate.get() : null;
            if (subDelegate != null) {
                return subDelegate.urlForDeepLink(event);
            }
        }
        return defaultUrl;
    }

    @Override
    public void onNotificationOpened(JSONObject notif, int buttonIndex) {
        synchronized (Delegate.class) {
            if (!subDelegateIsReady()) {
                // Save for later
                savedOpenedNotifications.add(new Pair<>(notif, buttonIndex));
                return;
            }
            SubDelegate subDelegate = Delegate.subDelegate != null ? Delegate.subDelegate.get() : null;
            if (subDelegate != null) {
                subDelegate.onNotificationOpened(notif, buttonIndex);
            }
        }
    }

    @Override
    public void onNotificationReceived(JSONObject notif) {
        synchronized (Delegate.class) {
            if (!subDelegateIsReady()) {
                // Save for later
                savedReceivedNotifications.add(notif);
                return;
            }
            SubDelegate subDelegate = Delegate.subDelegate != null ? Delegate.subDelegate.get() : null;
            if (subDelegate != null) {
                subDelegate.onNotificationReceived(notif);
            }
        }
    }

    private static boolean subDelegateIsReady() {
        SubDelegate subDelegate = Delegate.subDelegate != null ? Delegate.subDelegate.get() : null;
        if (subDelegate != null) return subDelegate.subDelegateIsReady();
        return false;
    }

}

