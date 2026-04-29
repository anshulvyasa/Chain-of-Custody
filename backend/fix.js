const fs = require('fs');
let content = fs.readFileSync('src/listeners/blockchainEvents.ts', 'utf8');

// Add the retry function at the top
if (!content.includes('executeWithRetry')) {
    const importMatch = content.match(/import.*?;\n/g);
    const lastImport = importMatch[importMatch.length - 1];
    const insertPos = content.indexOf(lastImport) + lastImport.length;
    
    const retryFunc = `
async function executeWithRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            if (error.code === 'P2002' && i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Max retries reached");
}
`;
    content = content.substring(0, insertPos) + retryFunc + content.substring(insertPos);
}

// 1. Fix CaseAdded
content = content.replace(
    `        try {
            await prisma.investigator.upsert({`,
    `        try {
            await executeWithRetry(async () => {
                await prisma.investigator.upsert({`
);
content = content.replace(
    `            })

            console.log("Succesfully Indexed Events Case Added")`,
    `            });
            });

            console.log("Succesfully Indexed Events Case Added")`
);

// 2. Fix DocumentHashAdded
content = content.replace(
    `            try {

                await prisma.investigator.upsert({`,
    `            try {
                await executeWithRetry(async () => {
                await prisma.investigator.upsert({`
);
content = content.replace(
    `                if (operations.length > 0) {
                    await prisma.$transaction(operations);
                }

            } catch (error) {`,
    `                if (operations.length > 0) {
                    await prisma.$transaction(operations);
                }
                });

            } catch (error) {`
);

// 3. Fix the rest which use `await prisma.$transaction([`
content = content.replace(
    /            try \{\n                await prisma\.\$transaction\(\[/g,
    `            try {
                await executeWithRetry(async () => {
                    await prisma.$transaction([`
);

content = content.replace(
    /                \]\);\n                console\.log\("Successfully Indexed/g,
    `                ]);
                });
                console.log("Successfully Indexed`
);

// Specifically for AccessDocument which has a different log format:
content = content.replace(
    /                \]\);\n\n                console\.log\(\`Successfully indexed AccessDocument/g,
    `                ]);
                });

                console.log(\`Successfully indexed AccessDocument`
);

fs.writeFileSync('src/listeners/blockchainEvents.ts', content);
console.log("File updated");
