package com.corelforcemobile

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WifiForceModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WifiForce"
    }

    @ReactMethod
    fun bindToWifi(promise: Promise) {
        try {
            val connectivityManager = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

            for (network in connectivityManager.allNetworks) {
                val capabilities = connectivityManager.getNetworkCapabilities(network)
                if (capabilities != null && capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    connectivityManager.bindProcessToNetwork(network)
                    promise.resolve(true)
                    return
                }
            }

            promise.reject("NO_WIFI", "No Wi-Fi network found")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}