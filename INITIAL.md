## FEATURE: Build the Codebase for Palm

I am building a simple meal/macro tracking application where I can also log photos. This will be a Nextjs App and the project architecture will look like this:

/frontend # All frontend stuff
    /web # NextJS web application (with REST API to CRUD against database using Prisma)
    /mobile
        /ios # Xcode application frontend that still interacts with deployed web 
/backend # All the necessary backend microservices (not API backend)

I have already intialized the nextjs app in frontend/web. I only want to work on the web application for now, but keep in mind that we will also be deploying an iOS app frontend as well that will need to interface with the CRUD REST backend we build in frontend/web/app/api

Here are the associated tasks we need to complete. 
1. Setup backend services for local testing, we will need a database (postgres), see this folder as an example of how I like to setup my local backend: /Users/cyakaboski/src/simage/good-head/backend
2. Create necessary .env.local file in frontend/web that connects to the local postgres instance.
3. Also create a lib/gcs.ts, cause we will be uploading images to gcp and serving them from there. Take a look at these files as an example of how I've done this in the past:
    - /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/lib/linkml/model-providers/simage.ts
    - /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/lib/gcs.ts
4. Create a prisma schema with the following tables with the following structure:
    - User
        - firstName
        - lastName
        - email
        - id (uuid)
        - meals
        - plans
    - Meal
        - id
        - proteinsUsed
        - fatsUsed
        - carbsUsed
        - veggiesUsed
        - junkUsed
        - image (optional) # gcs path
        - dateTime
        - user (foreign key)
        - notes (optional)
        - mealCategory (optional enum: breakfast, lunch, dinner, snack)
    - Plan
        - id
        - name
        - proteinSlots
        - fatSlots
        - carbSlots
        - veggieSlots
        - junkSlots
        - user (foreign key)
    - Note
        - id
        - text (long text)
        - meal (foreign key)
5. The we need to create the following pages
    a. /dashboard - User dashboard allows us to edit user data, meal data (tablular), plan information, etc. There, should be a sidebar with the following options home, meals, plans, user settings. The home tab should show daily slots I have in a radial chart (use shadcn ui charts using a radial chart: https://ui.shadcn.com/charts/radial#charts), a button to quickly add a meal, and like a running weekly trend of what the weekly status is. The meals tab should show a nice shadcn ui data table (https://ui.shadcn.com/docs/components/data-table) where we can CRUD on meals here in case we made a mistake. The plans tab should allow me to see all the plans I have and CRUD on plans, and also set an active plan, which is what the dashboard will use dynamically to calculate slots remaining and trends, etc. In the user data section, I want an option to be able to share my logs with a trainer so that they can navigate to a site like https://palm-domain.com/share/{user-uuid} and they will see a nice interface of all of my most recent meals with the picture showed in a gallery type interface and they can filter/sort by day and they can click on it and see my macro annotations. 
    b. /add-meal page - A very simple interface that allows the user to add a meal with the following form data (fields):
        - proteins used
        - fats used
        - carbs used
        - veggies used
        - junk used
        - upload picture
        - notes (should open up a dialog a note and should support multiple notes in state which then only get send to the backend REST api at form submission)
    c. /share/{user-uuid} - displays a nice gallery of all my meals default sorted so the most recent ones are on top, but the user had the ability to sort and filter, but they naturally can't do any crud. 
6. Figure out the best sharing type strategy, I think I just want to copy a link for now so that I can text it to my trainer and they don't need to log in and can immediately see my logs.
7. Build all the REST api CRUD interfaces in /app/api/rest/v1/{meals|plans}
8. Setup Google Auth using Auth.js for our authentication strategy. Look at this project for an example: /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/lib/auth.ts /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/middleware.ts here is what some protected api routes look like in this project: /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/app/api/rest/v1/dock/models/route.ts
9. Give me a list of environment variables that I will need to supply

## EXAMPLES:

Example of a nice structure I made is here in this other application: /Users/cyakaboski/src/simage/good-head

## Other Considerations
- Use shadcn-ui components, you'll need to install them.
- Figure out best practices for sharing these types of pages
- Let's use 