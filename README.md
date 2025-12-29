# Dissidia Final Fantasy Opera Omnia Clients & Gateway + iOS Signing

## For Android

Simple, just download the version you want from the [/Android](./Android) folder along with the Gateway app. Install both on the device you want (you may have to make sure the device allows apps to be installed from unofficial sources). Run the Gateway app and enter the IP address and port of the device on the same network running the offline server. After entering the IP address and port number, flick the switch on the right and you should get a message saying your gateway is running (Note: While you can enter more than one IP address, changing it after you have activated one requires you to restart the app). Minimize the Gateway app (don't close it) and start the DFFOO client. After the game connects to the server and you are loaded in, the Gateway app shouldn't be needed anymore.

## For iOS

With DFFOO for iOS, the method is a little different as Apple has more protections. The client app has to have your offline server's IP address hardcoded to it with a permissions changed in order to work. Because of this, there is no sidecar Gateway app, just a signer app for the ipa file that can be found in [releases](https://github.com/hearhellacopters/dffoo_gateway/releases). If your offline server's IP Address changes, you'll have to sign a new ipa file and re-install the app. So you must first run the dffoo_ios_signer app and follow the prompts to create the ipa file of the version you want to play (GL or JP).

It will generate a __OperaOmnia_GL.ipa__ or __OperaOmnia_JP.ipa__ file for sideloading. Check out [Sideloadly](https://sideloadly.io/) or [AltStore](https://altstore.io/) for non-jailbroken methods of installing. If your iOS is supported, [TrollStore](https://github.com/opa334/TrollStore) allows apps to be permasigned to the device without the need for refreshing.

Check [releases](https://github.com/hearhellacopters/dffoo_gateway/releases) for pre-build executables without needing Node to run.
