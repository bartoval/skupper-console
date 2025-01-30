/**
 * Checks if the query has balanced brackets (parentheses, curly braces, square brackets).
 * Uses a stack to keep track of opening brackets and ensures that they are closed in the correct order.
 */
export const hasBalancedBrackets = (query: string): { isValid: boolean; position?: number } => {
  const stack: { char: string; position: number }[] = [];
  const brackets: Record<string, string> = {
    '(': ')',
    '{': '}',
    '[': ']'
  };

  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if ('({['.includes(char)) {
      stack.push({ char, position: i });
    } else if (')}]'.includes(char)) {
      const last = stack.pop();
      if (!last || brackets[last.char] !== char) {
        return { isValid: false, position: i };
      }
    }
  }

  if (stack.length > 0) {
    return { isValid: false, position: stack[stack.length - 1].position };
  }

  return { isValid: true };
};
