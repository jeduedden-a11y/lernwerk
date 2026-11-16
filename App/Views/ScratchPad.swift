import SwiftUI
import PencilKit

enum PadTool: Hashable {
    case pen, marker, eraser

    var pkTool: PKTool {
        switch self {
        // black ink turns light in dark mode by itself
        case .pen: return PKInkingTool(.pen, color: .black, width: 3)
        case .marker: return PKInkingTool(.marker, color: .systemYellow, width: 18)
        case .eraser: return PKEraserTool(.bitmap)
        }
    }
}

/// A sheet of paper beside or below the task, for the working.
/// iPad: pen, eraser and the other tools come from the system palette, the same one Apple Notes uses. The lesson
/// makes room for it: while the palette is docked at the bottom, `onPaletteInset` reports how tall it is.
/// iPhone: a panel above the buttons with pen, marker and eraser in its own header; it steps aside while the keyboard is up.
struct ScratchPad: View {
    @Binding var drawing: PKDrawing
    var systemTools: Bool
    var onPaletteInset: (CGFloat) -> Void = { _ in }
    var onClose: () -> Void
    @State private var tool: PadTool = .pen
    @State private var undoRequests = 0

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Text("Notizblatt")
                    .font(.headline)
                    .lineLimit(1)
                Spacer(minLength: 4)
                if !systemTools {
                    Picker("Werkzeug", selection: $tool) {
                        Image(systemName: "pencil.tip").accessibilityLabel("Stift").tag(PadTool.pen)
                        Image(systemName: "highlighter").accessibilityLabel("Marker").tag(PadTool.marker)
                        Image(systemName: "eraser").accessibilityLabel("Radierer").tag(PadTool.eraser)
                    }
                    .pickerStyle(.segmented)
                    .frame(maxWidth: 150)
                    headerButton("arrow.uturn.backward", label: "Rückgängig") { undoRequests += 1 }
                        .disabled(drawing.strokes.isEmpty)
                }
                headerButton("trash", label: "Blatt leeren") { drawing = PKDrawing() }
                    .disabled(drawing.strokes.isEmpty)
                headerButton("xmark", label: "Notizblatt schließen") { onClose() }
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 8)
            Divider()
            CanvasView(drawing: $drawing, tool: tool, systemTools: systemTools, undoRequests: undoRequests, onPaletteInset: onPaletteInset)
                .accessibilityLabel("Zeichenfläche für Nebenrechnungen")
        }
    }

    private func headerButton(_ symbol: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.body.weight(.semibold))
                .frame(width: 22, height: 22)
        }
        .buttonStyle(.glass)
        .buttonBorderShape(.circle)
        .accessibilityLabel(label)
    }
}

/// PencilKit canvas. With systemTools the PencilKit palette (pens, eraser, colors, ruler, lasso) follows the canvas.
struct CanvasView: UIViewRepresentable {
    @Binding var drawing: PKDrawing
    var tool: PadTool
    var systemTools: Bool
    var undoRequests: Int
    var onPaletteInset: (CGFloat) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(drawing: $drawing, onPaletteInset: onPaletteInset) }

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        let coordinator = context.coordinator
        coordinator.canvas = canvas
        coordinator.undoRequests = undoRequests
        canvas.drawing = drawing
        canvas.backgroundColor = .clear
        canvas.isOpaque = false
        canvas.delegate = coordinator
        if systemTools {
            // follows the system setting »Nur mit Apple Pencil zeichnen«: then fingers scroll and the Pencil writes;
            // the double tap on the Pencil switches tools the way the system settings say
            canvas.drawingPolicy = .default
            canvas.alwaysBounceVertical = true
            coordinator.picker.addObserver(canvas)
            coordinator.picker.addObserver(coordinator)
            coordinator.picker.setVisible(true, forFirstResponder: canvas)
            Task { @MainActor in canvas.becomeFirstResponder() }
        } else {
            canvas.drawingPolicy = .anyInput
            canvas.tool = tool.pkTool
        }
        return canvas
    }

    func updateUIView(_ canvas: PKCanvasView, context: Context) {
        let coordinator = context.coordinator
        coordinator.drawing = $drawing
        coordinator.onPaletteInset = onPaletteInset
        // the only drawing change from outside is »Blatt leeren«
        if drawing.strokes.isEmpty && !canvas.drawing.strokes.isEmpty { canvas.drawing = drawing }
        if !systemTools && coordinator.tool != tool {
            coordinator.tool = tool
            canvas.tool = tool.pkTool
        }
        if coordinator.undoRequests != undoRequests {
            coordinator.undoRequests = undoRequests
            canvas.undoManager?.undo()
        }
    }

    static func dismantleUIView(_ canvas: PKCanvasView, coordinator: Coordinator) {
        coordinator.picker.setVisible(false, forFirstResponder: canvas)
        coordinator.picker.removeObserver(canvas)
        coordinator.picker.removeObserver(coordinator)
        canvas.resignFirstResponder()
        coordinator.onPaletteInset(0)
    }

    final class Coordinator: NSObject, PKCanvasViewDelegate, PKToolPickerObserver {
        let picker = PKToolPicker()
        var drawing: Binding<PKDrawing>
        var onPaletteInset: (CGFloat) -> Void
        var tool: PadTool = .pen
        var undoRequests = 0
        weak var canvas: PKCanvasView?

        init(drawing: Binding<PKDrawing>, onPaletteInset: @escaping (CGFloat) -> Void) {
            self.drawing = drawing
            self.onPaletteInset = onPaletteInset
        }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            drawing.wrappedValue = canvasView.drawing
        }

        /// Writing on the sheet brings the palette back after a tap into the lesson.
        func canvasViewDidBeginUsingTool(_ canvasView: PKCanvasView) {
            if !canvasView.isFirstResponder { canvasView.becomeFirstResponder() }
        }

        func toolPickerFramesObscuredDidChange(_ toolPicker: PKToolPicker) { reportInset(toolPicker) }

        func toolPickerVisibilityDidChange(_ toolPicker: PKToolPicker) { reportInset(toolPicker) }

        /// A palette docked at the bottom takes that much of the screen: the lesson gets smaller by it, so it is not
        /// covered. A palette the user moved elsewhere stays where it is and takes nothing.
        private func reportInset(_ toolPicker: PKToolPicker) {
            guard let window = canvas?.window, toolPicker.isVisible else {
                onPaletteInset(0)
                return
            }
            let frame = toolPicker.frameObscured(in: window)
            if frame.isNull || frame.isEmpty || frame.maxY < window.bounds.height - 1 {
                onPaletteInset(0)
            } else {
                onPaletteInset(max(0, (window.bounds.height - frame.minY).rounded()))
            }
        }
    }
}
