document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
  const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and previous content
      activitiesList.innerHTML = "";

      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic info
        const infoHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;
        activityCard.innerHTML = infoHTML;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // participant label
            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = participant;

            // delete button (small trash icon)
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "participant-delete";
            deleteBtn.setAttribute("aria-label", `Remove ${participant}`);
            deleteBtn.title = `Remove ${participant}`;
            deleteBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 6h18" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#c62828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 11v6" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>
                <path d="M14 11v6" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>
              </svg>`;

            // Wire up delete action
            deleteBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Ask backend to remove participant
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                const data = await resp.json();
                if (resp.ok) {
                  // show success and refresh
                  messageDiv.textContent = data.message;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  // refresh the activities list to reflect change and wait for it to complete
                  await fetchActivities();
                } else {
                  messageDiv.textContent = data.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }

                // hide after a moment
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const emptyP = document.createElement("p");
          emptyP.className = "no-participants";
          emptyP.textContent = "No participants yet";
          participantsSection.appendChild(emptyP);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to show updated participants and wait for it to finish
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
