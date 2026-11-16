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

/// A sheet of paper for the working. Its tools sit in its own header, so no floating palette covers the task.
/// iPad: made for the Apple Pencil. With »Nur mit Apple Pencil zeichnen« fingers scroll, and a double tap on the
/// Pencil switches between writing and erasing. iPhone: fingers draw.
struct ScratchPad: View {
    @Binding var drawing: PKDrawing
    var pencil: Bool
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
                Picker("Werkzeug", selection: $tool) {
                    Image(systemName: "pencil.tip").accessibilityLabel("Stift").tag(PadTool.pen)
                    Image(systemName: "highlighter").accessibilityLabel("Marker").tag(PadTool.marker)
                    Image(systemName: "eraser").accessibilityLabel("Radierer").tag(PadTool.eraser)
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 150)
                headerButton("arrow.uturn.backward", label: "Rückgängig") { undoRequests += 1 }
                    .disabled(drawing.strokes.isEmpty)
                headerButton("trash", label: "Blatt leeren") { drawing = PKDrawing() }
                    .disabled(drawing.strokes.isEmpty)
                headerButton("xmark", label: "Notizblatt schließen") { onClose() }
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 8)
            Divider()
            CanvasView(drawing: $drawing, tool: $tool, pencil: pencil, undoRequests: undoRequests)
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

/// PencilKit canvas with its own short undo history (the system palette is not used).
struct CanvasView: UIViewRepresentable {
    @Binding var drawing: PKDrawing
    @Binding var tool: PadTool
    var pencil: Bool
    var undoRequests: Int

    func makeCoordinator() -> Coordinator { Coordinator(drawing: $drawing, tool: $tool) }

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        let coordinator = context.coordinator
        canvas.drawing = drawing
        coordinator.last = drawing
        coordinator.applied = tool
        coordinator.undoRequests = undoRequests
        canvas.backgroundColor = .clear
        canvas.isOpaque = false
        canvas.delegate = coordinator
        canvas.tool = tool.pkTool
        if pencil {
            // follows »Nur mit Apple Pencil zeichnen« in the iPadOS settings: then fingers scroll and the Pencil writes
            canvas.drawingPolicy = UIPencilInteraction.prefersPencilOnlyDrawing ? .pencilOnly : .anyInput
            canvas.alwaysBounceVertical = true
            let interaction = UIPencilInteraction()
            interaction.delegate = coordinator
            canvas.addInteraction(interaction)
        } else {
            canvas.drawingPolicy = .anyInput
        }
        return canvas
    }

    func updateUIView(_ canvas: PKCanvasView, context: Context) {
        let coordinator = context.coordinator
        coordinator.drawing = $drawing
        coordinator.tool = $tool
        // the only drawing change from outside is »Blatt leeren«; it stays undoable
        if drawing.strokes.isEmpty && !canvas.drawing.strokes.isEmpty { canvas.drawing = drawing }
        if coordinator.applied != tool {
            coordinator.applied = tool
            canvas.tool = tool.pkTool
        }
        if coordinator.undoRequests != undoRequests {
            coordinator.undoRequests = undoRequests
            coordinator.undo(canvas)
        }
    }

    final class Coordinator: NSObject, PKCanvasViewDelegate, UIPencilInteractionDelegate {
        var drawing: Binding<PKDrawing>
        var tool: Binding<PadTool>
        var applied: PadTool = .pen
        var undoRequests = 0
        var last = PKDrawing()
        private var history: [PKDrawing] = []
        private var restoring = false
        private var beforeEraser: PadTool = .pen

        init(drawing: Binding<PKDrawing>, tool: Binding<PadTool>) {
            self.drawing = drawing
            self.tool = tool
        }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            if !restoring {
                history.append(last)
                if history.count > 60 { history.removeFirst() }
            }
            last = canvasView.drawing
            drawing.wrappedValue = canvasView.drawing
        }

        func undo(_ canvas: PKCanvasView) {
            guard let previous = history.popLast() else { return }
            restoring = true
            canvas.drawing = previous
            restoring = false
            last = previous
            drawing.wrappedValue = previous
        }

        /// A double tap on the Apple Pencil switches between writing and erasing (unless it is set to do nothing).
        func pencilInteraction(_ interaction: UIPencilInteraction, didReceiveTap tap: UIPencilInteraction.Tap) {
            guard UIPencilInteraction.preferredTapAction != .ignore else { return }
            if tool.wrappedValue == .eraser {
                tool.wrappedValue = beforeEraser
            } else {
                beforeEraser = tool.wrappedValue
                tool.wrappedValue = .eraser
            }
        }
    }
}
