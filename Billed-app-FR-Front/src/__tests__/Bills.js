//########## IMPORTS ##########//
import "@testing-library/jest-dom";
import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

//######## MOCK STORE ########//
jest.mock("../app/store", () => mockStore);

/////////////// EMPLOYEE IS CONNECTED \\\\\\\\\\\\\\\
describe("Given I am connected as an employee", () => {

	/////////////// EMPLOYEE IS ON BILLS PAGE \\\\\\\\\\\\\\\
	describe("When I am on Bills Page", () => {
  
		//########## CHEKING INVOICE ICON ##########//
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({
				type: 'Employee'
			}));
			document.body.innerHTML = `<div id="root"></div>`;
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");
			expect(windowIcon).toHaveClass("active-icon");
    	})

		//########## CHEKING OF INVOICES IS ORDERED FROM THE MOST RECENT TO THE OLDEST ##########//
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills })
			const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML),
			antiChrono = (a, b) => ((a < b) ? 1 : -1),
			datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted)
		})

    	//########## CHECKING THE LOADING PAGE ##########//
		test('Then loading page should be rendered', () => {
			const html = BillsUI({ loading: true });
			document.body.innerHTML = html;
			expect(screen.getByText("Loading...")).toBeTruthy();
		})

    	//########## CHECKING THE RENDERING ERROR PAGE ##########//
		test("Then error page should be rendered", () => {
			const html = BillsUI({ loading: false, error: true });
			document.body.innerHTML = html;
			expect(screen.getByTestId("error-message")).toBeTruthy();
		})

    	//########## CHECKING THE INVOICE DATA  ##########//
    	test("Then fetches bills from mock API GET", async () => {
			jest.spyOn(mockStore, "bills");
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({
				type: "Employee"
			}));
			document.body.innerHTML = `<div id="root"></div>`;
			router();
			window.onNavigate(ROUTES_PATH.Bills);

      		// check/control
			expect(await waitFor(() => screen.getByText("Mes notes de frais"))).toBeTruthy();
			expect(await waitFor(() => screen.getByTestId("tbody"))).toBeTruthy();
		})
  	})
  
	/////////////// EMPLOYEE CLICKS ON EYE ICON \\\\\\\\\\\\\\\
	describe("When i click on an eye icon", () => {
    	//########## CHECKING OF THE OPENING OF THE MODAL  ##########//
		test("Then the modal should open", () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({
				type: "Employee"
			}));
			const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname }),
			billsInit = new Bills({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage
			}),
			html = BillsUI({ data: bills });

			document.body.innerHTML = html;
			$.fn.modal = jest.fn();
			const eyeIcon = screen.getAllByTestId("icon-eye")[0],
			handleClickIconEye = jest.fn(billsInit.handleClickIconEye(eyeIcon));
      		eyeIcon.addEventListener("click", handleClickIconEye);
			fireEvent.click(eyeIcon);

      		expect(handleClickIconEye).toHaveBeenCalled();
		})
  	})

	/////////////// EMPLOYEE CLICKS ON NEW BILL BUTTON \\\\\\\\\\\\\\\
	describe("When i click on the button: new bill ", () => {
    	//########## CHECKING PAGE CHANGE ##########//
		test("Then, it should render NewBill page", () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem('user', JSON.stringify({
				type: 'Employee'
			}));
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			},
			billsInit = new Bills({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage
			}),
      		btnNewBill = screen.getByTestId("btn-new-bill"),
			handleClickNewBill = jest.fn(billsInit.handleClickNewBill);

      		// Simulation of user input
			btnNewBill.addEventListener("click", handleClickNewBill);
			fireEvent.click(btnNewBill);

			// check/control
			expect(handleClickNewBill).toHaveBeenCalled();
			expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
		})
  })

  	/////////////// BACKEND SERVER/API RETURNS AN ERROR \\\\\\\\\\\\\\\
	describe("When an error occurs on API", () => {
		beforeEach(() => {
			jest.spyOn(mockStore, "bills");
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({
				type: "Employee",
				email: "employee@test.tld"
			}));
			document.body.innerHTML = `<div id="root"></div>`;
			router();
		})
    
    	//########## CHECKING IF IT RETURNS AN ERROR IF THE DATE FORMAT IS NOT CORRECT ##########//
		test("Then return an error if the date format is not correct", async () => {
      		// CONST
			const mockBills = await mockStore.bills().list(),
			errorBill = [{ ...mockBills[0] }];
			errorBill[0].date = "2022/mm/10";

			// Simulation of user input
      		mockStore.bills.mockImplementationOnce(() => {
				return {list: () => Promise.resolve(errorBill)}
			});
			window.onNavigate(ROUTES_PATH.Bills);

      		// check/control
			expect(await waitFor(() => screen.getByText("2022/mm/10"))).toBeTruthy();
		})

    	//########## CHECKING FAILS WITH 404 MESSAGE ERROR ##########//
		test("Then fetches bills from an API and fails with 404 message error", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {list: () => Promise.reject(new Error("Erreur 404"))}
			});
			window.onNavigate(ROUTES_PATH.Bills);
			await new Promise(process.nextTick);
			const message = await waitFor(() => screen.getByText(/Erreur 404/));
			
      		// check/control
			expect(message).toBeTruthy();
		})

    	//########## CHECKING FAILS WITH 500 MESSAGE ERROR ##########//
		test("Then fetches messages from an API and fails with 500 message error", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {list: () => Promise.reject(new Error("Erreur 500"))}
			});
			window.onNavigate(ROUTES_PATH.Bills);
			await new Promise(process.nextTick);
			const message = await waitFor(() => screen.getByText(/Erreur 500/));

      		// check/control
			expect(message).toBeTruthy();
		})
	})
})