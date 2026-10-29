// Export deterministic evidence from the current program.
//@category RepositoryLab

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.Data;
import ghidra.program.model.listing.DataIterator;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionIterator;

public class ExportAnalysis extends GhidraScript {
    private static final List<String> EXPECTED_FUNCTIONS =
        List.of("choose_message", "compute_score");
    private static final String EXPECTED_MARKER = "GHIDRA_LAB_MARKER";

    @Override
    public void run() throws Exception {
        String[] arguments = getScriptArgs();
        if (arguments.length != 1) {
            throw new IllegalArgumentException("Expected one output JSON path");
        }

        List<String> detectedFunctions = new ArrayList<>();
        Function target = null;
        int functionCount = 0;
        FunctionIterator functions = currentProgram.getFunctionManager().getFunctions(true);
        while (functions.hasNext()) {
            Function function = functions.next();
            functionCount++;
            String name = function.getName();
            if (EXPECTED_FUNCTIONS.contains(name)) {
                detectedFunctions.add(name);
            }
            if (name.equals("compute_score")) {
                target = function;
            }
        }
        Collections.sort(detectedFunctions);

        List<String> detectedMarkers = new ArrayList<>();
        DataIterator dataItems = currentProgram.getListing().getDefinedData(true);
        while (dataItems.hasNext()) {
            Data data = dataItems.next();
            Object value = data.getValue();
            if (value instanceof String && ((String) value).contains(EXPECTED_MARKER)) {
                detectedMarkers.add((String) value);
            }
        }
        Collections.sort(detectedMarkers);

        String decompiled = "";
        if (target != null) {
            DecompInterface decompiler = new DecompInterface();
            try {
                decompiler.openProgram(currentProgram);
                DecompileResults results = decompiler.decompileFunction(target, 30, monitor);
                if (results.decompileCompleted() && results.getDecompiledFunction() != null) {
                    decompiled = results.getDecompiledFunction().getC();
                }
            }
            finally {
                decompiler.dispose();
            }
        }

        String json = "{\n" +
            "  \"analyzer\": \"ghidra-12.2-headless\",\n" +
            "  \"programName\": " + quote(currentProgram.getName()) + ",\n" +
            "  \"functionCount\": " + functionCount + ",\n" +
            "  \"expectedFunctions\": " + toJsonArray(EXPECTED_FUNCTIONS) + ",\n" +
            "  \"detectedFunctions\": " + toJsonArray(detectedFunctions) + ",\n" +
            "  \"expectedMarker\": " + quote(EXPECTED_MARKER) + ",\n" +
            "  \"detectedMarkers\": " + toJsonArray(detectedMarkers) + ",\n" +
            "  \"highLevelDecompilation\": " + (!decompiled.isEmpty()) + ",\n" +
            "  \"decompiledFunction\": " + quote(decompiled) + "\n" +
            "}\n";

        Files.writeString(Path.of(arguments[0]), json, StandardCharsets.UTF_8);
    }

    private static String toJsonArray(List<String> values) {
        List<String> quoted = new ArrayList<>();
        for (String value : values) {
            quoted.add(quote(value));
        }
        return "[" + String.join(", ", quoted) + "]";
    }

    private static String quote(String value) {
        StringBuilder escaped = new StringBuilder("\"");
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            switch (character) {
                case '\\': escaped.append("\\\\"); break;
                case '"': escaped.append("\\\""); break;
                case '\b': escaped.append("\\b"); break;
                case '\f': escaped.append("\\f"); break;
                case '\n': escaped.append("\\n"); break;
                case '\r': escaped.append("\\r"); break;
                case '\t': escaped.append("\\t"); break;
                default:
                    if (character < 0x20) {
                        escaped.append(String.format("\\u%04x", (int) character));
                    }
                    else {
                        escaped.append(character);
                    }
            }
        }
        return escaped.append('"').toString();
    }
}
