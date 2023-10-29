import * as ts from "typescript";
import * as fs from "fs";

export const createFile = () => {
  const file = ts.createSourceFile("myClass.ts", "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  // const asdf = ts.factory.createClassDeclaration(undefined, )

  const declareModifier = ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword);
  const storeNamespaceBlock = ts.factory.createModuleBlock([]);
  const storeNamespaceDecl = ts.factory.createModuleDeclaration(
    undefined,
    [declareModifier],
    ts.factory.createIdentifier("Store"),
    storeNamespaceBlock,
    ts.NodeFlags.Namespace,
  );

  const readonlyModifier = ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword);
  const result = printer.printNode(ts.EmitHint.Unspecified, storeNamespaceDecl, file);
  console.log(result);

  const fileInput = fs.readFileSync("src/abi/exampleClass.ts", "utf8");
  console.log(fileInput);
  printTypescript(fileInput);
};

function printTypescript(text: string) {
  let sourceFile = ts.createSourceFile("src/abi/test.ts", text, ts.ScriptTarget.ES2015, false);
  console.log(JSON.stringify(sourceFile.statements, null, "\t"));
}
