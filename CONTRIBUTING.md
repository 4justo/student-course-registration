# Contributing to the Student Course Registration System

Thank you for contributing to our project! To maintain high code quality, consistent documentation, and smooth collaboration within our Agile Kanban framework, please follow these guidelines and working agreements.

---

## 📋 Kanban Board Workflow & WIP Limits

Our team operates using a strict Kanban workflow via Trello. Every task, bug, or feature must be represented by a card and adhere to the following rules:

### 1. Board Columns & WIP Limits
* **BACKLOG:** All future tasks, feature definitions, and unprioritized bugs. (WIP: Unlimited)
* **TO DO:** Tasks committed for the current sprint/week. (WIP: Unlimited)
* **IN PROGRESS:** Tasks actively being coded or designed. (**WIP Limit: Maximum 3 cards**)
* **TESTING:** Completed features waiting for verification or bug fixes. (**WIP Limit: Maximum 2 cards**)
* **DONE:** Completed, tested, and fully accepted tasks. (WIP: Unlimited)

### 2. Card Requirements
Before moving a card from the **Backlog** or **To Do** columns, ensure it contains:
* An explicitly assigned **Owner** (e.g., Student A, B, C, etc.).
* A clear **Due Date** (formatted as `DD/MM/YYYY` or project timeline day).
* An **Estimated Time** for completion (e.g., `3 hrs`).
* A **Checklist** with a **minimum of 3 sub-tasks**.
* The correct **Priority/Category Label**:
    * 🔴 **Red:** High Priority
    * 🟡 **Yellow:** Medium Priority
    * 🟢 **Green:** Low Priority
    * 🔵 **Blue:** Documentation
    * 🟣 **Purple:** Design
    * 🟠 **Orange:** Bug / Issue

### 3. Movement Rules
* **Cards cannot move backwards.** If a bug or flaw is discovered during the **TESTING** phase, **do not move the card back to In Progress**. Instead, create a new **Bug/Issue card (Orange label)**, link it to the original task, place it in the Backlog/To Do, and prioritize its fix.
* **WIP Limits must be respected.** If the **IN PROGRESS** column has 3 cards or the **TESTING** column has 2 cards, no team member may pull a new card into that column. Instead, team members must **pair up** to complete and clear current bottlenecks first.
* No card can be moved to **DONE** without its checklist being 100% complete and receiving formal **QA Tester sign-off**.

---

## 🌿 Git Branching Strategy & Workflow

We follow a structured branching pattern to avoid merge conflicts and ensure code stability.

### 1. Branch Naming Conventions
Always create a descriptive branch from the main/development branch using the card number or feature name:
* Features: `feature/card-[X]-[short-description]` (e.g., `feature/card-5-login-module`)
* Bugs: `bugfix/card-[X]-[issue-name]` (e.g., `bugfix/card-11-auth-timeout`)
* Documentation: `docs/[topic]` (e.g., `docs/requirements-update`)

### 2. Development Workflow
1.  **Pull the latest changes:** Ensure your local workspace is up to date.
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **Create your branch:**
    ```bash
    git checkout -b feature/card-5-login-module
    ```
3.  **Commit frequently:** Use clear, professional commit messages detailing what was changed.
    ```bash
    git commit -m "Implement backend login authentication API and token logic"
    ```
4.  **Push your branch:**
    ```bash
    git push origin feature/card-5-login-module
    ```

---

## 🚀 Pull Requests & Code Review

1.  Open a Pull Request (PR) targeting the `main` or development branch.
2.  **PR Template / Description Requirements:**
    * **Trello Card Link:** Link to the corresponding Trello task.
    * **Changes Made:** Provide a bulleted summary of the modifications.
    * **Testing Done:** State what tests were conducted locally to ensure code stability.
3.  **Merge Conflicts:** If there is a merge conflict, resolve it immediately locally before asking for a review. Use Git feature branches and discuss with the Lead Developer if assistance is required.

---

## 🧪 Quality Assurance & Testing Guidelines

* Every functional feature code module requires a review and verification by the **QA Tester (Student F)** or designated analyst before code integration.
* **Definition of Done (DoD):**
    * Code builds successfully with no errors or warnings.
    * All criteria in the Trello card checklist are completely checked off.
    * The QA Tester has executed integration/functional test cases and signed off on the results.
    * All documentation or relevant ERD/Wireframe assets are fully updated.

---

## 🤝 Team Working Agreement

1.  **Daily Standups:** Attend the daily 15-minute maximum standup. Be prepared to answer:
    * *What did I complete yesterday?*
    * *What will I work on today?*
    * *Any blockers or impediments?*
2.  **Impediment Reporting:** If you face a blocker (e.g., *Database not ready*), report it immediately on Trello or to the **Kanban Manager (Student A)**. We will deploy agreed mitigations (e.g., using mock/JSON data temporarily).
3.  **Absences:** If a team member is absent, the Kanban Manager will reassign critical path cards to ensure delivery targets (Day 14 final submission) are met.
