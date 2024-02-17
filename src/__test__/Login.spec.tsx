import "@testing-library/jest-dom";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import * as nock from "nock";
import {
  render,
  renderHook,
  waitFor,
  screen,
  fireEvent,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useLogin from "../hooks/useLogin";
import LoginPage from "../pages/LoginPage";

const queryClient = new QueryClient({
  defaultOptions: {},
});

describe("로그인 테스트", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  // given - 로그인 화면이 그려진다.
  test("로그인에 실패하면 에러메시지가 나타난다.", async () => {
    const routes = [
      {
        path: "/signup",
        element: <LoginPage />,
      },
    ];

    const router = createMemoryRouter(routes, {
      initialEntries: ["/signup"],
      initialIndex: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    // when - 사용자가 로그인에 실패한다.
    nock("http://inflearn.byeongjinkang.com")
      .post("/user/login", {
        username: "test@test.com",
        password: "wrongPassword",
      })
      .reply(400, { msg: "NO_SUCH_USER" });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const emailInput = screen.findByLabelText("이메일");
    const passwordInput = screen.findByLabelText("비밀번호");

    fireEvent.change(await emailInput, {
      target: { value: "test@test.com" },
    });
    fireEvent.change(await passwordInput, {
      target: { value: "wrongPassword" },
    });

    const loginButton = screen.getByRole("button", { name: "로그인" });
    fireEvent.click(loginButton);

    const { result } = renderHook(() => useLogin(), { wrapper });

    // then - 에러메세지가 나타난다.
    await waitFor(() => result.current.isError);
    const errorMessage = await screen.findByTestId("error-message");
    expect(errorMessage).toBeInTheDocument();
  });
});
