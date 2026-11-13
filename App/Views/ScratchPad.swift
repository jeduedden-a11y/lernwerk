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

/// A sheet of paper beside the task, for the working.
/// iPad: a column next to the lesson with the system tool palette, made for the Apple Pencil.
/// iPhone: a panel above the buttons with pen, marker and eraser; it steps aside while the keyboard is up.
struct ScratchPad: View {
    @Binding var drawing: PKDrawing
    var systemTools: Bool
    var onClose: () -> Void
    @State private var tool: PadTool = .pen

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
                }
                Button {
                    drawing = PKDrawing()
                } label: {
                    Image(systemName: "trash")
                        .font(.body.weight(.semibold))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .disabled(drawing.strokes.isEmpty)
                .accessibilityLabel("Blatt leeren")
                Button {
                    onClose()
                } label: {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .accessibilityLabel("Notizblatt schließen")
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 8)
            Divider()
            CanvasView(drawing: $drawing, tool: tool, systemTools: systemTools)
                .accessibilityLabel("Zeichenfläche für Nebenrechnungen")
        }
    }
}

/// PencilKit canvas. With systemTools the PencilKit palette (colors, ruler, lasso) follows the canvas.
struct CanvasView: UIViewRepresentable {
    @Binding var drawing: PKDrawing
    var tool: PadTool
    var systemTools: Bool

    func makeCoordinator() -> Coordinator { Coordinator(drawing: $drawing) }

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.drawing = drawing
        canvas.backgroundColor = .clear
        canvas.isOpaque = false
        canvas.delegate = context.coordinator
        if systemTools {
            // follows the system setting »Nur mit Apple Pencil zeichnen«: then fingers scroll and the Pencil writes
            canvas.drawingPolicy = .default
            canvas.alwaysBounceVertical = true
            context.coordinator.picker.addObserver(canvas)
            context.coordinator.picker.setVisible(true, forFirstResponder: canvas)
            Task { @MainActor in canvas.becomeFirstResponder() }
        } else {
            canvas.drawingPolicy = .anyInput
            canvas.tool = tool.pkTool
        }
        return canvas
    }

    func updateUIView(_ canvas: PKCanvasView, context: Context) {
        context.coordinator.drawing = $drawing
        // the only change from outside is »Blatt leeren«
        if drawing.strokes.isEmpty && !canvas.drawing.strokes.isEmpty { canvas.drawing = drawing }
        if !systemTools && context.coordinator.tool != tool {
            context.coordinator.tool = tool
            canvas.tool = tool.pkTool
        }
    }

    static func dismantleUIView(_ canvas: PKCanvasView, coordinator: Coordinator) {
        coordinator.picker.setVisible(false, forFirstResponder: canvas)
        coordinator.picker.removeObserver(canvas)
        canvas.resignFirstResponder()
    }

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        let picker = PKToolPicker()
        var drawing: Binding<PKDrawing>
        var tool: PadTool = .pen

        init(drawing: Binding<PKDrawing>) { self.drawing = drawing }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            drawing.wrappedValue = canvasView.drawing
        }

        /// Writing on the sheet brings the palette back after a tap into the lesson.
        func canvasViewDidBeginUsingTool(_ canvasView: PKCanvasView) {
            if !canvasView.isFirstResponder { canvasView.becomeFirstResponder() }
        }
    }
}
