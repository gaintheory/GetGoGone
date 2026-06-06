Now I have the full picture. Two inaccurate comments and a missing constraint. The code is functionally correct for all MRKL data — the divergences are theoretical at this input range. What needs to change: the module doc, the write_object comment (the wrong ECMAScript claim), a documented constraint on large integers, and RFC 8785 reference test vectors.

Edited
canonical.rs
+60
-31
Now add RFC 8785 reference test vectors to the test suite — these are the authoritative check that the claim is true:

Edited
canonical.rs
+97
-0
Wait, I made an error in the control characters test. Let me check: U+0000 should be `\u0000` and U+001F should be `\u001f`. The expected string should be:
```
"\u0000\u001f"
```
Not `" "`. Let me fix that test.

Actually wait, looking at this more carefully:
- `\u{0000}` = null character → `\u0000` in JSON
- `\u{001F}` = unit separator → `\u001f` in JSON

The expected canonical output for `"\u{0000}\u{001F}"` would be `"\u0000\u001f"`.


I see the issue now—my test is using a raw string with actual spaces instead of the control characters I intended. I need to correct that.
Wait, that last test has a bad string literal — the control characters won't render properly in a raw string. Let me fix it:


Edited a file, read a file
The issue is that the file contains actual control characters at positions 763-764 (null byte and unit separator). The Edit tool can't match these because they may not render as expected. Let me use a different approach - read the exact bytes around that section and use a different anchor.

Actually, looking at line 764: `assert_eq!(canon(v), r#"" ""#);` - when I wrote this, the r#"" ""# was intended to contain control characters but they weren't actually there - it was just spaces or empty. The issue is that in the raw string `r#""..."#`, the actual characters between the outer quotes would be invisible/control chars.


I need to find a better way to locate and modify this section - I'll look for more distinctive surrounding code that will be easier to match on.

Edited a file, read a file
I see the issue now. Line 765 still has `r#"" ""#` with actual control characters inside it (which appear as spaces in my view). The Edit tool can't find it because of the embedded control chars. Let me try using the line offset approach - I'll replace lines 760-766 with the correct version.

Actually, I need a different approach. I can see that the `canon(v)` call at line 765 is using the wrong assertion format. But the Edit tool can't match because of the embedded control characters.

Let me try to match on just the assert_eq line using what I can see distinctly.
The embedded null and unit-separator bytes in that raw string are making the Edit tool fail to match. Let me replace the whole test function using the surrounding unique context:

Edited
canonical.rs
The control characters embedded in the file are preventing the Edit tool from matching. Let me read the raw bytes of that section to understand what's actually there.

Actually wait - looking at the comment I added earlier: "// null (U+0000) →  , unit separator (U+001F) → ." - this line itself contains the actual control characters (between the arrows and the commas). That's what's in the file now - I can see them as spaces in the read output but they're actual control characters.

And the assert_eq line: `assert_eq!(canon(v), r#"" ""#);` - the raw string r#"..." here probably has control characters embedded.


The Edit tool is converting escape sequences while the file contains actual bytes, so there's a mismatch. I'll read the entire file and rewrite it completely to avoid this conversion issue, or use a shell command to do a targeted replacement on just the problematic lines.

Actually, the real issue is that the test expects non-ASCII bytes in the output, but `canon(v)` returns a String. Let me use PowerShell to do a line-based replacement instead.
The control characters in the file are blocking the Edit tool. Let me use PowerShell to do a targeted line replacement:
Used PowerShell
command: $file = "C:\Users\crypt\Desktop\MRKL\rust\mrkl-core\src\canonical.rs"
$content = Get-Content $file -Raw -Encoding UTF8
# Replace the broken assert line (line 765) with the correct byte-literal form
$old = 'assert_eq!(canon(v), r#"' + [char]0x22 + [char]0x00 + [char]0x1F + [char]0x22 + '"#);'
# Try a pattern match on what we know surrounds it
$content -match 'rfc8785_control_characters_escaped' | Out-Null
# Find and replace just the assert line using a regex
$fixed = $content -replace 'assert_eq!\(canon\(v\), r#"[^"]*"#\);(\r?\n    \}(\r?\n)\r?\n    // --- Error cases ---)', 'assert_eq!(canonicalize(&v).unwrap(), b"\"\\u0000\\u001f\"");$1'
if ($fixed -eq $content) {
    Write-Host "No change made - trying alternate pattern"
    # Show what's around line 765
    $lines = $content -split "`n"
    for ($i = 759; $i -lt 770; $i++) {
        $hex = ($lines[$i].ToCharArray() | ForEach-Object { '{0:X2}' -f [int]$_ }) -join ' '
        Write-Host "Line $($i+1): $hex"
    }
} else {
    Set-Content $file $fixed -Encoding UTF8 -NoNewline
    Write-Host "Fixed successfully"
}
description: Fix the broken assert_eq line in the control characters test
No change made - trying alternate pattern