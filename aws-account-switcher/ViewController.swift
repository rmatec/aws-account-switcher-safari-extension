//
//  ViewController.swift
//  AWS Extend Switch Roles
//
//  Created by Raul Mate Cinza on 09/10/2020.
//

import Cocoa
import SafariServices.SFSafariApplication
import SafariServices.SFSafariExtensionManager

let appName = "AWS Extend Switch Roles"
let extensionBundleIdentifier = "com.raul.aws.aws-account-switcher"

class ViewController: NSViewController {

    @IBOutlet var appNameLabel: NSTextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.appNameLabel.stringValue = appName
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                self.appNameLabel.stringValue = "There was an initialization error. Please check whether the extension has been loaded in Safari."
                return
            }

            DispatchQueue.main.async {
                if (state.isEnabled) {
                    self.appNameLabel.stringValue = "\(appName)'s extension is currently on."
                } else {
                    self.appNameLabel.stringValue = "\(appName)'s extension is currently off. You can turn it on in Safari Extensions preferences."
                }
            }
        }
    }
    
    @IBAction func openSafariExtensionPreferences(_ sender: AnyObject?) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            guard error == nil else {
                self.appNameLabel.stringValue = "Could not automatically open Safari preferences. You can still enable the extension manually."
                return
            }

            DispatchQueue.main.async {
                NSApplication.shared.terminate(nil)
            }
        }
    }

}
