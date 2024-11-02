import { AptosApiError } from "../../src/errors";
import { AptosApiType } from "../../src/utils/const.js";

describe(AptosApiError.name, () => {
  it("should generate pretty error messages", () => {
    const err = new AptosApiError({
      apiType: AptosApiType.PEPPER,
      aptosRequest: {
        url: "http://blabla.com/my/api:8080",
        method: "POST",
      },
      aptosResponse: {
        data: { error: "something went wrong" },
        status: 400,
        statusText: "Bad Request",
        url: "http://blabla.com/my/api:8080",
        headers: {},
      },
    });

    expect(err.message).toMatchSnapshot();

    const err2 = new AptosApiError({
      apiType: AptosApiType.INDEXER,
      aptosRequest: {
        url: "http://blabla.com/my/api:8080",
        method: "POST",
      },
      aptosResponse: {
        data: {
          data: null,
          errors: [
            {
              message: "Your graphql query is invalid.",
            },
          ],
        },
        status: 200,
        statusText: "OK",
        url: "http://blabla.com/my/api:8080",
        headers: {},
      },
    });

    expect(err2.message).toMatchSnapshot();

    const err3 = new AptosApiError({
      apiType: AptosApiType.INDEXER,
      aptosRequest: {
        url: "http://blabla.com/my/api:8080",
        method: "POST",
      },
      aptosResponse: {
        data: {
          // some kinda large response payload
          foo: "bar",
          bar: "baz",
          nested: {
            asssdf: "asdf",
            asdf: ["asdfadsafds", "Asdfadafs"],
            assssdf: "asdf",
            afsdf: ["asdfadsafds", "Asdfadafs"],
            assassdf: "asdf",
            asasfdssdf: "asdf",
            asdff: ["asdfadsafds", "Asdfadafs"],
            assfsdf: "asdf",
            assfddf: ["asdfadsaasfdfds", "Asdfadafs"],
            asdfssdf: "asdf",
            asasdfdf: ["asdfadsafds", "Asdfadafs"],
            a2sdf: ["asdfadsafds", "Asdfadafs"],
            a2ssssdf: "asdf",
            ccasdfasdfsaasdf: ["asdfadsafds", "Asdfadafs"],
            cassssdf: "asdf",
            caasasfdssdf: "asdf",
            assdf: ["asdfadsafds", "Asdfadafs"],
            assafadsfsssdf: "asdf",
            asssasadfsfddf: ["asdfadsaasfdfds", "Asdfadafs"],
            asfdfssdf: "asdf",
            asaasdfsdfdf: ["asdfadsafds", "Asdfadafs"],
            afsasdfadfdf: ["asdfadsafds", "Asdfadafs"],
            assasdfsafdssdf: "asdf",
            asfdf: ["asdfadsafds", "Asdfadafs"],
            afadsfsssssdf: "asdf",
            aasfdafsasfdssdf: "asdf",
            asadsfasdfdf: ["asdfadsafds", "Asdfadafs"],
            assasdfadfssdf: "asdf",
            assadsfafdsfddf: ["asdfadsaasfdfds", "Asdfadafs"],
            asdadffasfssdf: "asdf",
            asdfss: ["asdfadsafds", "Asdfadafs"],
          },
        },
        status: 200,
        statusText: "OK",
        url: "http://blabla.com/my/api:8080",
        headers: {
          traceparent: "00-4312e4b208ab6749e42fc534e8590424-e94f817439ef9429-01",
        },
      },
    });
    expect(err3.message).toMatchSnapshot();
  });
});
