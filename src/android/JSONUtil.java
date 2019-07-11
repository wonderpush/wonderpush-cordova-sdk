package com.wonderpush.sdk.cordova;

import android.net.Uri;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

class JSONUtil {

    protected static String getString(JSONObject object, String field) {
        if (!object.has(field) || object.isNull(field)) {
            return null;
        } else {
            return object.optString(field, null);
        }
    }

    static String optString(JSONObject object, String field) {
        if (object == null) return null;
        if (!object.has(field) || object.isNull(field)) return null;
        Object value = object.opt(field);
        if (value instanceof String) {
            return (String) value;
        }
        return null;
    }

    static Boolean optBoolean(JSONObject object, String field) {
        if (object == null) return null;
        if (!object.has(field) || object.isNull(field)) return null;
        Object value = object.opt(field);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return null;
    }

    static Integer optInteger(JSONObject object, String field) {
        if (object == null) return null;
        if (!object.has(field) || object.isNull(field)) return null;
        Object value = object.opt(field);
        if (value instanceof Integer) {
            return (Integer) value;
        } else if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    static long[] optLongArray(JSONObject object, String field) {
        if (object == null) return null;
        if (!object.has(field) || object.isNull(field)) return null;
        JSONArray array = object.optJSONArray(field);
        if (array == null) return null;
        long[] rtn = new long[array.length()];
        for (int i = 0, l = array.length(); i < l; ++i) {
            Object value = array.opt(i);
            if (value instanceof Long) {
                rtn[i] = (Long) value;
            } else if (value instanceof Number) {
                rtn[i] = ((Number) value).longValue();
            } else {
                return null;
            }
        }
        return rtn;
    }

    static Uri optUri(JSONObject object, String field) {
        if (object == null) return null;
        if (!object.has(field) || object.isNull(field)) return null;
        String value = object.optString(field, null);
        if (value == null) return null;
        return Uri.parse(value);
    }

    /**
     * @see JSONObject#wrap(Object)
     */
    static Object wrap(Object o) {
        if (o == null) {
            return JSONObject.NULL;
        }
        if (o instanceof JSONArray || o instanceof JSONObject) {
            return o;
        }
        if (o.equals(JSONObject.NULL)) {
            return o;
        }
        try {
            if (o instanceof Collection) {
                return new JSONArray((Collection) o);
            } else if (o.getClass().isArray()) {
                return JSONArray(o);
            }
            if (o instanceof Map) {
                return new JSONObject((Map) o);
            }
            if (o instanceof Boolean ||
                    o instanceof Byte ||
                    o instanceof Character ||
                    o instanceof Double ||
                    o instanceof Float ||
                    o instanceof Integer ||
                    o instanceof Long ||
                    o instanceof Short ||
                    o instanceof String) {
                return o;
            }
            if (o.getClass().getPackage().getName().startsWith("java.")) {
                return o.toString();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * @see JSONArray#JSONArray(Object)
     */
    static JSONArray JSONArray(Object array) throws JSONException {
        if (!array.getClass().isArray()) {
            throw new JSONException("Not a primitive array: " + array.getClass());
        }
        final JSONArray rtn = new JSONArray();
        final int length = Array.getLength(array);
        for (int i = 0; i < length; ++i) {
            rtn.put(wrap(Array.get(array, i)));
        }
        return rtn;
    }

    static <T> List<T> JSONArrayToList(JSONArray array, Class<T> typecheck) {
        final int length = array == null ? 0 : array.length();
        ArrayList<T> rtn = new ArrayList<>(length);
        if (array != null) {
            for (int i = 0; i < length; ++i) {
                try {
                    Object item = array.get(i);
                    if (typecheck.isInstance(item)) {
                        rtn.add(typecheck.cast(item));
                    }
                } catch (JSONException ex) {
                    Log.e("WonderPush", "Unexpected exception in JSONArrayToList", ex);
                } catch (ClassCastException ex) {
                    Log.e("WonderPush", "Unexpected exception in JSONArrayToList", ex);
                }
            }
        }
        return rtn;
    }

}
