# Lessons Learned - Critical Mistakes & How to Avoid Them

**⚠️ IMPORTANT: Read this file BEFORE attempting any major bug fixes or feature implementations**

**Last Updated:** 2025-10-07
**Status:** Active Reference Document

---

## 🎯 Purpose of This Document

This document catalogs CRITICAL MISTAKES made during development to prevent repeating them. Every mistake here caused:
- Production outages
- Business impact
- Loss of user trust
- Wasted development time

**Before you fix a bug or add a feature:**
1. Read this document completely
2. Check if the issue pattern matches previous mistakes
3. Plan your approach thoroughly before making changes
4. Test changes locally before deploying

---

## 🚨 CRITICAL INCIDENT: 2025-10-07 - Infinite Re-Render Loop

### **The Disaster:**
User reported viewer page was crashing with "Application error: a client-side exception" (React Error #310: "Too many re-renders"). Made **7 FAILED ATTEMPTS** to fix it, each time claiming I found "the real root cause." Each failed fix was deployed to production, making the issue worse.

### **Failed Attempts (Chronological):**

#### **Attempt 1: Focus Restoration with useEffect**
- **What I Did:** Added `useEffect` to desktop chat input to restore focus after re-renders
- **Why It Failed:** useEffect with NO dependency array runs after EVERY render, creating infinite loop
- **Commit:** `24ecfe6`
- **Impact:** Page crashed worse than before

#### **Attempt 2: Throttling Focus Restoration**
- **What I Did:** Added 100ms throttling to the useEffect to "fix" the infinite loop
- **Why It Failed:** Still had no deps array, throttling just slowed the loop, didn't stop it
- **Commit:** `8d4dad7`
- **Impact:** Page still crashed

#### **Attempt 3: Throttling Mobile Too**
- **What I Did:** Applied same broken throttling to mobile component
- **Why It Failed:** Same root cause - useEffect with no deps array
- **Commit:** `4fe010d`
- **Impact:** Broke mobile too

#### **Attempt 4: Revert Focus Restoration**
- **What I Did:** Removed all focus restoration code
- **Why It Helped:** Removed ONE infinite loop source but not THE root cause
- **Commit:** `9b3568f`
- **Impact:** Page still crashed

#### **Attempt 5: Error Handling for Chat Fetch**
- **What I Did:** Added try-catch to chat history loading
- **Why It Helped Slightly:** Prevented one error from crashing page, but didn't fix underlying loop
- **Commit:** `42c843c`
- **Impact:** Page still crashed with different symptoms

#### **Attempt 6: Memoize ALL Callbacks**
- **What I Did:** Wrapped WebSocket callbacks in useCallback thinking unstable references caused loop
- **Why It Failed:** Was treating a SYMPTOM not the ROOT CAUSE
- **Commit:** `3b69456`
- **Impact:** Page still crashed

#### **Attempt 7: Use Refs for Callbacks in useWebSocket**
- **What I Did:** Stored callbacks in refs inside useWebSocket hook
- **Why It Failed:** STILL not the actual root cause
- **Commit:** `c262bfb`
- **Impact:** Page still crashed

### **THE ACTUAL ROOT CAUSE (Never Found):**

Looking at the browser console, the error was:
```
Failed to fetch chat messages: Object
Uncaught Error: Minified React error #310
```

**What I SHOULD Have Done:**
1. **Check what commit it was working on** - It was `6b73f56`
2. **Revert immediately** instead of making 7 guesses
3. **Read the actual error carefully** - It says "Failed to fetch chat messages"
4. **Check if chat fetch was causing re-renders** somehow
5. **Test locally before deploying each "fix"**

### **Lessons:**

#### ✅ **DO:**
1. **Revert first, debug second** - When production is broken, revert to last working commit IMMEDIATELY
2. **Read error messages carefully** - Don't jump to conclusions
3. **Test locally before pushing** - EVERY change should be tested locally first
4. **One hypothesis at a time** - Don't shotgun 7 different fixes
5. **Check git history** - `git log` shows what was working before
6. **Use git bisect** - Binary search through commits to find what broke it
7. **Add logging strategically** - Console.log at key points to understand flow
8. **Check browser network tab** - See what requests are failing
9. **Verify your fix locally** - Hard refresh browser after code changes

#### ❌ **DON'T:**
1. **DON'T claim "THE REAL ROOT CAUSE" multiple times** - If you said it before and were wrong, you're probably wrong again
2. **DON'T deploy unverified fixes to production** - Each deploy takes 2+ minutes and affects real users
3. **DON'T make reactive fixes** - Think deeply before changing code
4. **DON'T add complexity** - Focus restoration useEffect was MORE complex than needed
5. **DON'T trust your first instinct** - Your first instinct was wrong 7 times in a row
6. **DON'T keep digging** - When you're in a hole, stop digging
7. **DON'T break working code while fixing broken code** - Revert first

---

## 🔍 Pattern: The "Root Cause" Anti-Pattern

### **Warning Signs You're Falling Into This Trap:**

1. You say "I found the REAL root cause" for the 2nd+ time
2. You're making changes without testing locally
3. You're adding complexity (refs, throttling, memoization) to "fix" something
4. You're not reading error messages carefully
5. You're deploying each fix immediately without verification
6. User is frustrated and saying "is this what you call a fix?"

### **How to Break Out:**

1. **STOP** - Don't make another change
2. **REVERT** - `git reset --hard <last-working-commit>`
3. **FORCE PUSH** - `git push --force` to restore production
4. **BREATHE** - Take 5 minutes to think
5. **INVESTIGATE** - Read errors, check logs, test locally
6. **PLAN** - Write down your hypothesis BEFORE coding
7. **TEST LOCALLY** - Verify the fix works
8. **DEPLOY** - Only after local verification

---

## 🐛 Common Debugging Mistakes

### **1. Infinite Re-Render Loops**

**Common Causes:**
- useEffect with no dependency array
- Creating new objects/functions in render (breaks referential equality)
- State updates triggering effects that update state
- Callback dependencies not memoized

**How to Debug:**
```typescript
// Add this at top of component to detect re-render loops
useEffect(() => {
  console.log('Component rendered', Date.now());
});

// Check if specific prop is causing re-renders
useEffect(() => {
  console.log('Prop changed:', someProp);
}, [someProp]);
```

**Prevention:**
- Always add dependency array to useEffect
- Memoize callbacks with useCallback
- Memoize expensive computations with useMemo
- Wrap components in React.memo when passing callbacks
- Use refs for values that shouldn't trigger re-renders

### **2. Focus Loss in Input Fields**

**Common Causes:**
- Parent component re-rendering (destroys input element)
- Component unmounting and remounting
- Too many state updates causing re-render storm
- Auto-hide logic destroying DOM elements

**How to Debug:**
```typescript
// Check if component is unmounting
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);

// Check re-render frequency
const renderCount = useRef(0);
renderCount.current++;
console.log('Render count:', renderCount.current);
```

**Prevention:**
- Use CSS visibility instead of conditional rendering
- Memoize parent component and callbacks
- Debounce rapid state updates
- Keep input elements mounted, just hide them

### **3. State Updates Not Propagating**

**Common Causes:**
- Mutating state directly instead of creating new reference
- Closure over stale state in callbacks
- Asynchronous updates not batched
- Missing dependencies in useCallback/useMemo

**Prevention:**
- Always use setter functions with new objects/arrays
- Use functional setState: `setState(prev => newValue)`
- Add all dependencies to useCallback/useMemo/useEffect
- Use refs for latest values that don't need to trigger re-renders

---

## 🧪 Testing Checklist Before Deploying Fixes

### **Required Steps:**

- [ ] **1. Reproduce issue locally** - Can you make it happen on localhost?
- [ ] **2. Identify root cause** - What is the ACTUAL cause, not a symptom?
- [ ] **3. Write fix** - Keep it simple, minimal changes
- [ ] **4. Test fix locally** - Does it actually work?
- [ ] **5. Test affected features** - Did you break anything else?
- [ ] **6. Hard refresh browser** - Clear cache, test again
- [ ] **7. Check console for errors** - Any new warnings/errors?
- [ ] **8. Test on mobile** - If it affects mobile users
- [ ] **9. Review git diff** - Does the change make sense?
- [ ] **10. Commit with clear message** - Describe what you fixed and why

### **For Critical Bugs (Production Outages):**

- [ ] **1. REVERT FIRST** - Get production working immediately
- [ ] **2. Notify user** - Let them know production is restored
- [ ] **3. Then debug properly** - On a separate branch
- [ ] **4. Test extensively** - More than usual
- [ ] **5. Deploy during off-hours** - Minimize impact if it fails
- [ ] **6. Monitor closely** - Watch logs after deploy

---

## 🚫 Never Do This (Absolute Rules)

### **1. Never Deploy Unverified Fixes**
❌ **DON'T:**
```bash
# Make change
git add .
git commit -m "fix: hopefully this works"
git push
```

✅ **DO:**
```bash
# Make change
npm run dev
# Test thoroughly at http://localhost:3009
# Verify fix works
git add .
git commit -m "fix: specific description of what was fixed"
git push
```

### **2. Never Use useEffect Without Deps Array**
❌ **DON'T:**
```typescript
useEffect(() => {
  doSomething();
}); // Runs after EVERY render = infinite loop risk
```

✅ **DO:**
```typescript
useEffect(() => {
  doSomething();
}, [dependency1, dependency2]); // Only runs when deps change
```

### **3. Never Mutate State Directly**
❌ **DON'T:**
```typescript
const [items, setItems] = useState([]);
items.push(newItem); // Mutates state directly
```

✅ **DO:**
```typescript
const [items, setItems] = useState([]);
setItems(prev => [...prev, newItem]); // Creates new array
```

### **4. Never Claim "Root Cause" Without Proof**
❌ **DON'T:**
- Say "This is definitely the root cause" without testing
- Deploy multiple "root cause fixes" in a row
- Ignore evidence that contradicts your hypothesis

✅ **DO:**
- Test your hypothesis locally first
- Be honest: "I think this might be the cause, let me verify"
- If first fix doesn't work, revert and reassess

### **5. Never Add Complexity as First Solution**
❌ **DON'T:**
- Add refs, memoization, throttling as first attempt
- Introduce new patterns without understanding existing code
- Rewrite working code to "fix" something else

✅ **DO:**
- Try simplest fix first
- Understand why current code exists before changing it
- Revert to simpler working version if complex fix fails

---

## 📚 Reference: React Performance Patterns

### **When to Use React.memo:**
```typescript
// Component receives props that don't change often
// But parent re-renders frequently
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* render data */}</div>;
});
```

### **When to Use useCallback:**
```typescript
// Callback passed to memoized child component
// Or used in dependency array of other hooks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]); // Only recreate when value changes
```

### **When to Use useMemo:**
```typescript
// Expensive computation that doesn't need to run every render
const expensiveResult = useMemo(() => {
  return expensiveOperation(data);
}, [data]); // Only recompute when data changes
```

### **When to Use useRef:**
```typescript
// Value that needs to persist but shouldn't trigger re-renders
const latestCallback = useRef(callback);
latestCallback.current = callback; // Always latest, never causes re-render

// DOM references
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();
```

---

## 🎓 Key Takeaways

1. **Revert first, debug second** - Production stability > your ego
2. **Test locally always** - Every change, every time
3. **Simple fixes first** - Don't add complexity unnecessarily
4. **Read errors carefully** - They usually tell you what's wrong
5. **One change at a time** - Make it work, then commit
6. **Trust the user** - If they say it's broken, it's broken
7. **Admit when wrong** - "I was wrong, reverting" is better than 7 failed fixes
8. **Document mistakes** - Add to this file so future you learns

---

## 📖 Additional Resources

- [React Re-Renders Guide](https://react.dev/learn/render-and-commit)
- [useEffect Complete Guide](https://overreacted.io/a-complete-guide-to-useeffect/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Git Bisect Tutorial](https://git-scm.com/docs/git-bisect)

---

## 🔄 How This Document Should Be Used

**Before Every Bug Fix:**
1. Search this document for similar issues
2. Read the relevant anti-patterns
3. Check the testing checklist
4. Plan your approach

**After Making a Mistake:**
1. Document it here immediately
2. Describe what went wrong
3. Explain why it went wrong
4. Add prevention strategies
5. Commit this file with your fix

**During Code Review:**
1. Check if changes follow lessons here
2. Verify testing checklist was followed
3. Look for anti-patterns
4. Approve only if meets standards

---

**Remember: Every mistake documented here was painful. Learn from them so you don't repeat them.**
