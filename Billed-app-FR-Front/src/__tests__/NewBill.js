//######## IMPORT ########//
import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import router from "../app/Router.js";

//######## MOCK STORE ########//
jest.mock("../app/store", () => mockStore);


const onNavigateTest = cb => {
	document.body.innerHTML = NewBillUI();
	const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname }),
	newBillInit = new NewBill({
		document,
		onNavigate,
		store: mockStore,
		localStorage: window.localStorage,
	});
	cb(newBillInit);
}

/////////////// EMPLOYEE IS CONNECTED \\\\\\\\\\\\\\\
describe("Given I am connected as an employee", () => {
	/////////////// EMPLOYEE IS ON NewBill PAGE \\\\\\\\\\\\\\\
	describe("When I am on NewBill Page", () => {
		// Repeat preparation: using the "beforeEach" hook
		beforeEach(() => {
			jest.spyOn(mockStore, "bills");
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({
				type: "Employee",
				email: "admin@test.tld"
			}));
			document.body.innerHTML = `<div id="root"></div>`;
			router();
		})

		//########## CHEKING LETTER ICON ##########//
		test("Then letter icon in vertical layout should be highlighted", async () => {
			window.onNavigate(ROUTES_PATH.NewBill);
			const mailIcon = screen.getByTestId("icon-mail");
			expect(mailIcon).toHaveClass("active-icon");
		})

		//########## CHEKING TITLE OF THE FORM ##########//
		test("Then title text content should be displayed", async () => {
			window.onNavigate(ROUTES_PATH.NewBill);
			expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
		})

		//########## CHEKING FIELDS ##########//
		test("Then required fields have the 'Required' attribute'", () => {
			expect(screen.getByTestId("expense-type")).toBeRequired();
			expect(screen.getByTestId("expense-name")).toBeRequired();
			expect(screen.getByTestId("datepicker")).toBeRequired();
			expect(screen.getByTestId("amount")).toBeRequired();
			expect(screen.getByTestId("vat")).not.toBeRequired();
			expect(screen.getByTestId("pct")).toBeRequired();
			expect(screen.getByTestId("commentary")).not.toBeRequired();
			expect(screen.getByTestId("file")).toBeRequired();
		})
	})

	/////////////// EMPLOYEE IS SUBMIT THE FORM (EMPTY FIELDS) \\\\\\\\\\\\\\\
	describe("When I submit the form with empty fields", () => {
		//########## CHEKING THE FORM ##########//
		test("Then I should stay on NewBill page", () => onNavigateTest(newBillInit => {
			// Here all fields are empty
			expect(screen.getByTestId("expense-name").value).toBe("");
			expect(screen.getByTestId("datepicker").value).toBe("");
			expect(screen.getByTestId("amount").value).toBe("");
			expect(screen.getByTestId("vat").value).toBe("");
			expect(screen.getByTestId("pct").value).toBe("");
			expect(screen.getByTestId("file").value).toBe("");

			const form = screen.getByTestId("form-new-bill"),
			handleSubmit = jest.fn((e) => newBillInit.handleSubmit(e));

			form.addEventListener("submit", handleSubmit);
			fireEvent.submit(form);
			expect(handleSubmit).toHaveBeenCalled();
			expect(form).toBeTruthy();
		}))
	})

	/////////////// EMPLOYEE CHOOSE FILE \\\\\\\\\\\\\\\
	describe("When I choose an image to upload", () => {

		//########## CHEKING FILE IS VALID ##########//
		test("Then, the file is valid", async () => onNavigateTest(newBillInit => {
			// constants
			const inputFile = screen.getByTestId("file"),
			file = new File(["img"], "image.jpg", { type: "image/jpg" }),
			handleChangeFile = jest.fn(newBillInit.handleChangeFile);

			//Simulate and interact
			inputFile.addEventListener("change", handleChangeFile);
			userEvent.upload(inputFile, file);

			// check/control
			expect(handleChangeFile).toHaveBeenCalled();
			expect(inputFile.files[0]).toStrictEqual(file);

			// ERROR TO REVIEW
			//expect(screen.getByTestId("file").parentElement).not.toHaveClass("error");
		}))

		//########## CHEKING FILE IS NOT VALID ##########//
		test("Then, is the file is not valid", async () => onNavigateTest(newBillInit => {
			// constants
			const file = new File(["img"], "bill.pdf", { type: "document/pdf" }),
			inputFile = screen.getByTestId("file"),
			handleChangeFile = jest.fn(newBillInit.handleChangeFile);
			
			//Simulate and interact
			inputFile.addEventListener("change", handleChangeFile);
			userEvent.upload(inputFile, file);

			// check/control
			expect(handleChangeFile).toHaveBeenCalled();
			expect(inputFile.files[0].type).toBe("document/pdf");
			expect(inputFile.parentElement).toHaveClass("error");
		}))
	})

	/////////////// EMPLOYEE IS SUBMIT THE NewBill FORM \\\\\\\\\\\\\\\
	describe("When I submit Newbill form", () => {

		//########## CHEKING FORM IS VALID ##########//
		test("Then, is the form is valid", () => onNavigateTest(newBillInit => {
			//  CONST
			const type = screen.getByTestId("expense-type"),
			name = screen.getByTestId("expense-name"),
			date = screen.getByTestId("datepicker"),
			amount = screen.getByTestId("amount"),
			vat = screen.getByTestId("vat"),
			pct = screen.getByTestId("pct"),
			comment = screen.getByTestId("commentary"),
			img = screen.getByTestId("file"),
			form = screen.getByTestId("form-new-bill"),
			inputValues = {
				type: "Transports",
				name: "Vol Paris Bayonne",
				date: "2022-10-10",
				amount: "200",
				vat: 40,
				pct: 50,
				commentary: "Commentaire",
				file: new File(["img"], "image.jpg", { type: "image/jpg" }),
			},
			handleSubmit = jest.fn(newBillInit.handleSubmit);

			// Simulation of user input
			fireEvent.change(type, { target: { value: inputValues.type } });
			fireEvent.change(name, { target: { value: inputValues.name } });
			fireEvent.change(date, { target: { value: inputValues.date } });
			fireEvent.change(amount, { target: { value: inputValues.amount } });
			fireEvent.change(vat, { target: { value: inputValues.vat } });
			fireEvent.change(pct, { target: { value: inputValues.pct } });
			fireEvent.change(comment, { target: { value: inputValues.commentary } });
			userEvent.upload(img, inputValues.file);
			form.addEventListener("submit", handleSubmit);
			fireEvent.submit(form);

			// check/control
			expect(handleSubmit).toHaveBeenCalled();
			expect(type.validity.valid).toBeTruthy();
			expect(name.validity.valid).toBeTruthy();
			expect(date.validity.valid).toBeTruthy();
			expect(amount.validity.valid).toBeTruthy()
			expect(vat.validity.valid).toBeTruthy();
			expect(pct.validity.valid).toBeTruthy();
			expect(comment.validity.valid).toBeTruthy();
			expect(img.files[0]).toBeDefined();
		}))

		//########## CHEKING FORM IS NOT VALID ##########//
		test("Then, is the form is not valid", () => onNavigateTest(newBillInit => {
			// CONST
			const type = screen.getByTestId("expense-type"),
			name = screen.getByTestId("expense-name"),
			date = screen.getByTestId("datepicker"),
			amount = screen.getByTestId("amount"),
			vat = screen.getByTestId("vat"),
			pct = screen.getByTestId("pct"),
			comment = screen.getByTestId("commentary"),
			img = screen.getByTestId("file"),
			form = screen.getByTestId("form-new-bill"),
			inputValues = {
				type: "Bad format",
				name: "Vol Paris Bayonne",
				date: "Bad format",
				amount: "Bad format",
				vat: 40,
				pct: "Bad Format",
				commentary: "Commentaire",
				file: new File(["img"], "image.jpg", { type: "image/jpg" }),
			},
			handleSubmit = jest.fn(newBillInit.handleSubmit);


			// Simulation of user input
			fireEvent.change(type, { target: { value: inputValues.type } });
			fireEvent.change(name, { target: { value: inputValues.name } });
			fireEvent.change(date, { target: { value: inputValues.date } });
			fireEvent.change(amount, { target: { value: inputValues.amount } });
			fireEvent.change(vat, { target: { value: inputValues.vat } });
			fireEvent.change(pct, { target: { value: inputValues.pct } });
			fireEvent.change(comment, { target: { value: inputValues.commentary } });
			userEvent.upload(img, inputValues.file);
			form.addEventListener("submit", handleSubmit);
			fireEvent.submit(form);

			// check/control
			expect(handleSubmit).toHaveBeenCalled();
			expect(type.validity.valid).not.toBeTruthy();
			expect(date.validity.valid).not.toBeTruthy();
			expect(amount.validity.valid).not.toBeTruthy()
			expect(pct.validity.valid).not.toBeTruthy();
		}))
	})

  	/////////////// BACKEND SERVER/API RETURNS IS OK (NOT HAVE ERROR) \\\\\\\\\\\\\\\
	describe("When APi is working correctly", () => {
		//########## CHECKING PAGE CHANGE TO Bills ##########//
		test("then i should be sent on bills page with bills updated", async () => onNavigateTest(newBillInit => {
			// CONST
			const form = screen.getByTestId("form-new-bill"),
			handleSubmit = jest.fn(newBillInit.handleSubmit);

			// Simulation of user input
			form.addEventListener("submit", handleSubmit);
			fireEvent.submit(form);

			// check/control
			expect(handleSubmit).toHaveBeenCalled();
			expect(screen.getByText("Mes notes de frais")).toBeTruthy();
			expect(mockStore.bills).toHaveBeenCalled();
		}))
	})

  	/////////////// BACKEND SERVER/API RETURNS AN ERROR \\\\\\\\\\\\\\\
	describe("When an error occurs on API", () => {

    	//########## CHECKING THE DISPLAY OF FAILS WITH 500 MESSAGE ERROR ##########//
		test("Then it should display a 500 message error", async () => {
			document.body.innerHTML = NewBillUI();
			// CONST
			const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname }),
			newBillInit = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage,
			}),
			form = screen.getByTestId("form-new-bill"),
			handleSubmit = jest.fn(newBillInit.handleSubmit);

			// Simulation of user input
			mockStore.bills.mockImplementationOnce(() => {
				return {
					update: () => Promise.reject(new Error("Erreur 500"))
				};
			});
			console.error = jest.fn();
			form.addEventListener("submit", handleSubmit);
			fireEvent.submit(form);

			// check/control
			expect(handleSubmit).toHaveBeenCalled();
			await waitFor(() => new Promise(process.nextTick));
			expect(console.error).toHaveBeenCalled();
		})
	})
})
