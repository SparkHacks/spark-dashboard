# Sparkhacks Dashboard

Welcome to the Sparkhacks Dashboard! Below you will find how the website is structured, how to use the site, and how it is structured.

## Tech Stack
This project uses a mix of older TSX/CSS components and newer Astro file components. To anyone in the future, please develop using Astro for components and TS for scripting purposes.

The database is Firebase. Users have roles, derived from Firebase's **Custom Claims**. Example:

1. Fetch User:  

    `const user = await getAuth(app).getUserByEmail(email);`
2. Get Claims: 
    
    `const currentClaims = user.customClaims || {};`

More can be found in `src/api/modify-roles.ts`.

Deployment is on Vercel, using the sparkhacks account. Contact the directors/webdev leads for credentials.

## Current Acceptance Track

When a user submits an application, they start in a **Pending** state.

A director reviews pending applications and can move them to either:
- **Invited** (accepted into the org/event)
- **Waitlisted** (not accepted yet, but still being considered)

If a user is **Invited**, they can respond by:
- **Accepting** the invitation
- **Declining** the invitation

#### Status Flow Diagram

```text
[Application Submitted]
          |
          v
       (Pending)
       /      \
      v        v
 (Waitlisted) (Invited)
                 |
                 v
        +----------------+
        | User Responds  |
        +----------------+
           /        \
          v          v
     (Accepted)  (Declined)
```

## Roles

Roles take priority of the top role, and inherit the privilages of the lower roles as well.

- **No Role** - User sees the application page and dashboard (`ApplicantDashboard.astro`)
- **QR Scanner** - Can access the QR page to scan users in
- **Web Dev** - Can see all pages, and add/remove all roles (except admin)
- **Director** - Can change applicants' statuses
- **Admin** - Can also change a user's admin status.

## Firebase Settings

In Firebase under the Settings collection, you can change the settings of:

- **revealDecision**: Show applicant's decision. When false, the user will we pending, no matter what their status is.
- **canEdit**: The user can edit their application.
- **newUserState**: Legacy name. Basically open/close applications.


## Setup Local
1. Install dependencies:
```
npm i
```

2. Copy the .env.example as .env with the sparkhacks-apply info.

3. Run:
```
npm run dev
```

## Set Up New Year

For each year in Sparkhacks, we use a new collection in the `sparkhacks-apply` Firebase DB. Create a new collection in the Firebase called `Form-XX`, with the XX as the current year. Now in our project, we need to set up the new consts. In:

> src/config/constants.ts

In the `const YEAR_TO_DB`, add a new **1st** element of the `"YEAR": "Form Name"`. Our first year had a different naming scheme, but we wil try to have a more consistent naming scheme from here on out. 

Also change const FORMS_COLLECTION to the most recent collection. This controls what collection is used.

In:

> src/utils/questions.ts

you can find the quesions used. When adding a new question, you will also need to update the applicant table (`AdminBoard.tsx`) in the view expansion, and also the validation in `utils.ts` and any apis in `src/api` inclduing anything in the `auth` folder.

## Deployment

Vercel automatically creates a deployment. You can test the deployment by adding the deployment URL (do not push to production yet) into the Firebase authorized domains for testing (found under Authentication > Settings > Authorized Domains > "Add Domain"). You cannot test without adding this.

Also when testing in the `config/constants.ts` is a `NON_UIC_BYPASS` for bypassing the UIC email signin check. But you could also add your test account as a exception user as well.

Test all changes thoroughly, including on Admin/User accounts, in other pages, on other devices, and with other people. 

After the testing is done, remove the temp URL from the Firebase. We have a `prod` branch. Develop features in branches from main or directly onto main. When you have a substantial amonunt of changes, merge `main` into `prod`. If you want you can follow the naming convention of:

> XX.XX: Title

Where the first two numbers indicate a major update, and the second set indicate a small change or bugfix, followed by an encompassing title.

Of course if something needs to be **urgently** pushed, you can just deploy the commit from the main, but having a `prod` branch allows for more quality updates.

When you want to push an update to production, go to vercel, click on the 3 dots on the right side of the commit you want to deploy, and click promote to production.


