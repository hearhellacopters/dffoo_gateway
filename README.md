# Dissidia Final Fantasy Opera Omnia Clients & Gateway + iOS Signing

Everything for getting your game client running again.

## For Android Devices

**Difficulty**: Easy

For getting the game client running again, simply download the version you want from the [/Android](./Android) folder along with the `DFFOOGateway.apk` app. Install both on the device you want (you may have to make sure the device *allows apps to be installed from unofficial sources*). Run the `Gateway` app and __enter the IP address and port displayed on the device the offline server is running on__. After entering the IP address and port number, toggle on the switch on the right and you should get a message saying your gateway is running (Note: While you can enter more than one IP address, but changing it after you have activated one requires you to restart the app). Minimize the Gateway app (**don't close it**) then start the DFFOO client. After the game connects to the server and you are loaded in, the Gateway app shouldn't be needed untill next launch.

## For Android Emulators

**Difficulty**: Easy

Any emulator that ran the offical client should be able to run our modded one. Just follow the direction for [Android Devices](#for-android-devices) and you should be fine. Again making sure the device *allows apps to be installed from unofficial sources*.

### Recommended Emulator

**Difficulty**: Medium

If you're running Windows 11, a simple emulator set up can be found in [Windows Subsystem for Android](https://github.com/MustardChef/WSABuilds/releases). Look for Windows 11 x64 builds (or ARM64 if you're running Windows installed on a Mac machine). Look for `NoGApps-RemovedAmazon` in the file title for a bare bones, no bloatware set up. Follow the install instructions. Then for the best preformance...

In Advanced Settings: 
- Turn on `Developer mode`. 
- In `Memory and preformance`, set memory allocations to least `6 GB` (recommended `Custom 8192`)
- Set `Graphics preference` to `High preformance`
- Set `Window focus` to `Independent`
- In `Experimental features`, turn on `Local network access` and `Share user folders` then set it to where you downloaded the .apk files.

If you have `Share user folders` on, click back to the `System` tab then open `Files`. It should open the Files app to display a `Windows` folder at the bottom. The apk file should be displayed inside. Clicking on it will install the game client. You can verify that it installed by clicking the `Apps` tab in `Windows Subsystem for Android` window and seeing if it's displayed.

As a bonus, if you have `Local network access` active and you're on the same system running the offline server, you won't need the `DFFOOGateway.apk` app. The the client will automatically connect without the need for an IP switch.

## For iOS Devices

**Difficulty**: Hard

With DFFOO for iOS, the method is a little different as Apple has more protections. The client app has to have your offline server's IP address hardcoded to it with a permissions changed in order to work. Because of this, there is no sidecar Gateway app, just a `dffoo_ios_signer` app for the ipa file that can be found in [releases](https://github.com/hearhellacopters/dffoo_gateway/releases). **NOTE:** If your offline server's IP address changes, you'll have to sign a new ipa file and re-install the app. So you must first run the `dffoo_ios_signer` app and follow the prompts to create the ipa file of the version you want to play (GL or JP).

It will generate a __OperaOmnia_GL.ipa__ or __OperaOmnia_JP.ipa__ file for sideloading. Check out [Sideloadly](https://sideloadly.io/) or [AltStore](https://altstore.io/) for non-jailbroken methods of installing. If your iOS is supported by [TrollStore](https://github.com/opa334/TrollStore), it will allows apps to be perma-signed to the device without the need for refreshing once a week.

Check [releases](https://github.com/hearhellacopters/dffoo_gateway/releases) for pre-build executables without the need to run the code on Node.

## For Mac Devices

**Difficulty**: Medium

Follow the direction for [iOS Devices](#for-ios-devices) to create your api file, then use [Sideloadly](https://sideloadly.io/) to install it directly to your Mac. **NOTE:** While this should work, I haven't tested this. You will also have the same limits as Sideloadly for iOS where you need to refresh the app every 7 days.