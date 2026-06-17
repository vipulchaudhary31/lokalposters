import AppKit
import Foundation
import WebKit

final class Renderer: NSObject, WKNavigationDelegate {
  private let svgURL: URL
  private let outputURL: URL
  private let width: Int
  private let height: Int
  private var webView: WKWebView?

  init(svgURL: URL, outputURL: URL, width: Int, height: Int) {
    self.svgURL = svgURL
    self.outputURL = outputURL
    self.width = width
    self.height = height
  }

  func run() {
    let config = WKWebViewConfiguration()
    let view = WKWebView(frame: NSRect(x: 0, y: 0, width: width, height: height), configuration: config)
    view.navigationDelegate = self
    view.setValue(false, forKey: "drawsBackground")
    webView = view

    let svgString: String
    do {
      svgString = try String(contentsOf: svgURL, encoding: .utf8)
    } catch {
      fputs("Failed to read SVG: \(error)\n", stderr)
      exit(1)
    }

    let html = """
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          html, body {
            margin: 0;
            width: \(width)px;
            height: \(height)px;
            overflow: hidden;
            background: transparent;
          }
          svg {
            display: block;
            width: \(width)px;
            height: \(height)px;
          }
        </style>
      </head>
      <body>
        \(svgString)
      </body>
    </html>
    """

    view.loadHTMLString(html, baseURL: svgURL.deletingLastPathComponent())
    RunLoop.current.run()
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    let config = WKSnapshotConfiguration()
    config.rect = CGRect(x: 0, y: 0, width: width, height: height)

    webView.takeSnapshot(with: config) { image, error in
      if let error {
        fputs("Snapshot failed: \(error)\n", stderr)
        exit(1)
      }

      guard let image,
            let tiffData = image.tiffRepresentation,
            let bitmap = NSBitmapImageRep(data: tiffData),
            let pngData = bitmap.representation(using: .png, properties: [:]) else {
        fputs("Failed to encode PNG\n", stderr)
        exit(1)
      }

      do {
        try pngData.write(to: self.outputURL)
      } catch {
        fputs("Failed to write PNG: \(error)\n", stderr)
        exit(1)
      }

      exit(0)
    }
  }
}

let arguments = CommandLine.arguments
guard arguments.count == 5 else {
  fputs("Usage: render-svg-to-png.swift <input.svg> <output.png> <width> <height>\n", stderr)
  exit(64)
}

let inputURL = URL(fileURLWithPath: arguments[1])
let outputURL = URL(fileURLWithPath: arguments[2])
guard let width = Int(arguments[3]), let height = Int(arguments[4]) else {
  fputs("Width and height must be integers\n", stderr)
  exit(64)
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

let renderer = Renderer(svgURL: inputURL, outputURL: outputURL, width: width, height: height)
renderer.run()
